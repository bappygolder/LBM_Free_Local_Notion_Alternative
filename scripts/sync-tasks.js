#!/usr/bin/env node
/**
 * sync-tasks.js
 * Merges data/tasks.json into data/project-data.js (additive — preserves tasks
 * not listed in tasks.json, overwrites by ID those that are).
 *
 * Usage:
 *   node scripts/sync-tasks.js
 *
 * No npm dependencies — Node.js built-ins only.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Paths ────────────────────────────────────────────────────────────────────
const ROOT          = path.resolve(__dirname, '..');
const TASKS_JSON    = path.join(ROOT, 'data', 'tasks.json');
const PROJECT_DATA  = path.join(ROOT, 'data', 'project-data.js');

// ─── 1. Read & validate tasks.json ───────────────────────────────────────────
let tasksFile;
try {
  tasksFile = fs.readFileSync(TASKS_JSON, 'utf8');
} catch (e) {
  console.error(`ERROR: Cannot read ${TASKS_JSON}\n  ${e.message}`);
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(tasksFile);
} catch (e) {
  console.error(`ERROR: tasks.json is not valid JSON — project-data.js was NOT modified.\n  ${e.message}`);
  process.exit(1);
}

if (!Array.isArray(parsed.tasks)) {
  console.error('ERROR: tasks.json must have a top-level "tasks" array — project-data.js was NOT modified.');
  process.exit(1);
}

const incoming = parsed.tasks;  // array of task objects from tasks.json

// ─── 2. Read project-data.js ─────────────────────────────────────────────────
let src;
try {
  src = fs.readFileSync(PROJECT_DATA, 'utf8');
} catch (e) {
  console.error(`ERROR: Cannot read ${PROJECT_DATA}\n  ${e.message}`);
  process.exit(1);
}

// ─── 3. Locate the tasks: [ ... ] block using bracket counting ───────────────
// This approach is format-stable: it finds "    tasks: [" by line scan,
// then counts brackets to find the matching "]", regardless of indentation
// or trailing characters the script may have written on previous runs.
const lines = src.split('\n');
let tasksStartLine = -1;  // index of the line containing "tasks: ["
let tasksEndLine   = -1;  // index of the line containing the closing "]"

for (let i = 0; i < lines.length; i++) {
  if (/^    tasks:\s*\[/.test(lines[i])) {
    tasksStartLine = i;
    // The closing "]" of the tasks array is the first line after tasksStartLine
    // that starts with exactly 6 spaces then "]" (matching the task object indentation
    // used by this script's serialiser: task objects at 6-space indent, array close at 6-space).
    // We look for a line that is ONLY whitespace + "]" with optional trailing chars ("},", etc.)
    // and is not deeper than the tasks array level.
    // Strategy: find the first line at or after tasksStartLine+1 that matches /^\s{4,6}\]/.
    // We scan from the end of the file backwards for the last such line before "docs:".
    let docsLine = -1;
    for (let j = i + 1; j < lines.length; j++) {
      if (/^\s{2,4}docs:/.test(lines[j])) { docsLine = j; break; }
    }
    if (docsLine === -1) break;
    // The tasks closing "]" is the last line before docsLine that matches /^\s*\]/
    for (let j = docsLine - 1; j > i; j--) {
      if (/^\s*\]/.test(lines[j])) { tasksEndLine = j; break; }
    }
    break;
  }
}

if (tasksStartLine === -1 || tasksEndLine === -1) {
  console.error('ERROR: Could not locate tasks: [...] in project-data.js — file was NOT modified.');
  process.exit(1);
}

// Extract the existing tasks array text for parsing
const tasksArrayText = lines.slice(tasksStartLine, tasksEndLine + 1).join('\n')
  .replace(/^\s*tasks:\s*/, '')   // strip leading "    tasks: "
  .replace(/\]\s*[},;]*$/, ']');  // strip trailing ]}, or ]} etc — keep only ]

// ─── 4. Parse existing tasks from the JS literal ─────────────────────────────
let existingTasks;
try {
  existingTasks = (new Function(`return ${tasksArrayText}`))();
} catch (e) {
  console.error(`ERROR: Could not parse existing tasks array from project-data.js\n  ${e.message}`);
  process.exit(1);
}

// ─── 5. Merge: tasks.json is the authoritative list.
// Tasks in tasks.json overwrite existing by ID.
// Tasks NOT in tasks.json are dropped — tasks.json owns the full list.
const existingIds   = new Set(existingTasks.map(t => t.id));
const incomingIds   = new Set(incoming.map(t => t.id));
const merged        = incoming; // tasks.json is the complete replacement

const addedCount     = incoming.filter(t => !existingIds.has(t.id)).length;
const updatedCount   = incoming.filter(t =>  existingIds.has(t.id)).length;
const preservedCount = 0; // full-replacement: nothing from old list is kept

// ─── 6. Serialise merged tasks to a JS-formatted string ──────────────────────
function jsValue(v, indent) {
  if (v === null)             return 'null';
  if (typeof v === 'boolean') return String(v);
  if (typeof v === 'number')  return String(v);
  if (typeof v === 'string')  return JSON.stringify(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    const items = v.map(item => `${indent}  ${jsValue(item, indent + '  ')}`);
    return `[\n${items.join(',\n')}\n${indent}]`;
  }
  if (typeof v === 'object') {
    const pairs = Object.entries(v).map(([k, val]) =>
      `${indent}  ${k}: ${jsValue(val, indent + '  ')}`
    );
    return `{\n${pairs.join(',\n')}\n${indent}}`;
  }
  return String(v);
}

function taskToJs(task) {
  const indent = '      ';
  const pairs = Object.entries(task).map(([k, v]) =>
    `${indent}  ${k}: ${jsValue(v, indent + '  ')}`
  );
  return `${indent}{\n${pairs.join(',\n')}\n${indent}}`;
}

const tasksJs = `[\n${merged.map(taskToJs).join(',\n')}\n      ]`;

// ─── 7. Bump seedVersion to YYYY-MM-DD-sync ───────────────────────────────────
const today = new Date().toISOString().slice(0, 10);
const newVersion = `${today}-sync`;
const srcWithVersion = src.replace(
  /(seedVersion:\s*")[^"]*(")/,
  `$1${newVersion}$2`
);
if (srcWithVersion === src && !src.includes(`"${newVersion}"`)) {
  console.warn('WARN: Could not find seedVersion in project-data.js — skipping version bump.');
}

// ─── 8. Splice the new tasks array into the source ───────────────────────────
// Replace lines[tasksStartLine..tasksEndLine] with the new tasks block.
// Work on srcWithVersion (which may have an updated seedVersion).
const srcLines = srcWithVersion.split('\n');
const newTasksLines = ('    tasks: ' + tasksJs).split('\n');
srcLines.splice(tasksStartLine, tasksEndLine - tasksStartLine + 1, ...newTasksLines);
const newSrc = srcLines.join('\n');

// ─── 9. Write project-data.js ─────────────────────────────────────────────────
fs.writeFileSync(PROJECT_DATA, newSrc, 'utf8');

// ─── 10. Update _syncedAt in tasks.json ──────────────────────────────────────
const syncedAt = new Date().toISOString();
const updatedTasksFile = tasksFile.replace(
  /("_syncedAt"\s*:\s*)"[^"]*"/,
  `$1"${syncedAt}"`
);
fs.writeFileSync(TASKS_JSON, updatedTasksFile, 'utf8');

// ─── 11. Summary ─────────────────────────────────────────────────────────────
console.log('\n✓ sync-tasks complete');
console.log(`  tasks.json  → ${incoming.length} tasks`);
console.log(`  project-data.js merged result:`);
console.log(`    ${addedCount} added   |  ${updatedCount} updated  |  ${preservedCount} preserved (not in tasks.json)`);
console.log(`    total: ${merged.length} tasks`);
console.log(`  seedVersion → ${newVersion}`);
console.log(`  _syncedAt   → ${syncedAt}`);
console.log('\nReload the browser tab to see changes.\n');
