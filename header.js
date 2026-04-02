/* ─────────────────────────────────────────────────────────────────────────────
   header.js — universal project title (loads on every page)
   Reads and writes the project name to localStorage so changes made on any
   page (Tasks, Docs, Resources) persist everywhere.
───────────────────────────────────────────────────────────────────────────── */

(function () {
  "use strict";

  function storageKey() {
    var pd = window.MCCProjectData;
    return ((pd && pd.tracker && pd.tracker.storageKey) || "ltm-task-tracker-v1") + "-project-name";
  }

  function defaultName() {
    var pd = window.MCCProjectData;
    return (pd && pd.project && pd.project.name) || "LBM";
  }

  // ── Tab indicator ─────────────────────────────────────────────────────────────
  function initTabIndicator() {
    var nav = document.querySelector("nav.tabs");
    if (!nav) return;

    var tabs = Array.prototype.slice.call(nav.querySelectorAll(".tab"));
    if (!tabs.length) return;

    var activeIndex = -1;
    tabs.forEach(function (tab, i) {
      if (tab.classList.contains("active")) activeIndex = i;
    });
    if (activeIndex === -1) return;

    var indicator = document.createElement("div");
    indicator.className = "tab-indicator instant";
    nav.insertBefore(indicator, nav.firstChild);

    function measure(index) {
      var tab = tabs[index];
      var navRect = nav.getBoundingClientRect();
      var tabRect = tab.getBoundingClientRect();
      return {
        left: tabRect.left - navRect.left,
        width: tabRect.width,
        height: tabRect.height
      };
    }

    function place(index, instant) {
      var m = measure(index);
      if (instant) indicator.classList.add("instant");
      indicator.style.left = m.left + "px";
      indicator.style.width = m.width + "px";
      indicator.style.height = m.height + "px";
    }

    var PREV_KEY = "lbm.tab.prev";
    var prevIndex = parseInt(sessionStorage.getItem(PREV_KEY) || "-1", 10);
    var startIndex = (prevIndex >= 0 && prevIndex < tabs.length) ? prevIndex : activeIndex;

    // Snap to previous tab position instantly
    place(startIndex, true);
    indicator.offsetHeight; // force reflow

    // Then slide to current tab
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        indicator.classList.remove("instant");
        place(activeIndex, false);
      });
    });

    // Record current before navigating away
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        sessionStorage.setItem(PREV_KEY, activeIndex);
      });
    });
  }

  // ── Page transition (exit on tab click, enter via CSS animation) ─────────────
  function initPageTransitions() {
    var contentEl = document.querySelector(".page-wrap, .docs-page, .resources-wrap");
    if (!contentEl) return;

    document.querySelectorAll("a.tab").forEach(function (link) {
      link.addEventListener("click", function (e) {
        if (link.classList.contains("active")) return;
        e.preventDefault();
        var href = link.href;
        contentEl.classList.add("page-exiting");
        setTimeout(function () {
          window.location.href = href;
        }, 160);
      });
    });
  }

  // ── App menu ──────────────────────────────────────────────────────────────────

  var RESET_BACKUP_KEY    = "lbm.reset.backup";
  var SKIP_RESET_CONF_KEY = "lbm_skipResetConfirm";

  // Creates and shows the persistent undo banner. Returns { dismiss }.
  // Exposed on window._lbmAppMenu so task-app.js can reuse it.
  function createUndoBanner(message, onUndo, onDismiss) {
    var existing = document.getElementById("resetUndoBanner");
    if (existing) existing.remove();

    var banner = document.createElement("div");
    banner.className = "reset-undo-banner";
    banner.id = "resetUndoBanner";
    banner.setAttribute("role", "alert");
    banner.innerHTML =
      '<span class="reset-undo-message">' + message + '</span>' +
      '<button class="reset-undo-btn" type="button">Undo</button>' +
      '<button class="reset-undo-dismiss" type="button" aria-label="Dismiss">' +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      "</button>";

    document.body.appendChild(banner);

    function dismiss() {
      banner.classList.remove("is-visible");
      banner.classList.add("is-hiding");
      setTimeout(function () { if (banner.parentNode) banner.remove(); }, 250);
      if (onDismiss) onDismiss();
    }

    banner.querySelector(".reset-undo-btn").addEventListener("click", function () {
      dismiss();
      onUndo();
    });
    banner.querySelector(".reset-undo-dismiss").addEventListener("click", dismiss);

    // Animate in
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        banner.classList.add("is-visible");
      });
    });

    return { dismiss: dismiss };
  }

  function initAppMenu() {
    var btn               = document.getElementById("appMenuBtn");
    var dropdown          = document.getElementById("appMenuDropdown");
    var resetAppItem      = document.getElementById("menuResetApp");
    var seedInfoBtn       = document.getElementById("menuSeedInfoBtn");
    var seedInfoPanel     = document.getElementById("seedInfoPanel");
    var overlay           = document.getElementById("resetAppOverlay");
    var cancelBtn         = document.getElementById("resetAppCancelBtn");
    var confirmBtn        = document.getElementById("resetAppConfirmBtn");
    var confirmInput      = document.getElementById("resetConfirmInput");
    var advancedToggle    = document.getElementById("menuAdvancedToggle");
    var advancedPanel     = document.getElementById("advancedPanel");
    var skipResetToggle   = document.getElementById("skipResetToggle");

    if (!btn || !dropdown) return;

    function openMenu() {
      dropdown.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      btn.classList.add("is-open");
    }

    function closeMenu() {
      dropdown.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      btn.classList.remove("is-open");
      if (seedInfoPanel) seedInfoPanel.hidden = true;
      if (seedInfoBtn) { seedInfoBtn.setAttribute("aria-expanded", "false"); seedInfoBtn.classList.remove("is-active"); }
    }

    function openResetModal() {
      if (!overlay) return;
      // Reset the input + button state each open
      if (confirmInput) {
        confirmInput.value = "";
        confirmInput.classList.remove("is-valid");
      }
      if (confirmBtn) confirmBtn.disabled = true;
      overlay.hidden = false;
      if (confirmInput) confirmInput.focus();
    }

    function closeResetModal() {
      if (!overlay) return;
      overlay.hidden = true;
      if (confirmInput) confirmInput.value = "";
      if (confirmBtn) confirmBtn.disabled = true;
      btn.focus();
    }

    // Type-to-confirm: enable the button only when input === "reset"
    if (confirmInput && confirmBtn) {
      confirmInput.addEventListener("input", function () {
        var valid = confirmInput.value.trim().toLowerCase() === "reset";
        confirmBtn.disabled = !valid;
        confirmInput.classList.toggle("is-valid", valid);
      });
      confirmInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !confirmBtn.disabled) confirmBtn.click();
      });
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (dropdown.hidden) openMenu(); else closeMenu();
    });

    if (seedInfoBtn && seedInfoPanel) {
      seedInfoBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var isOpen = !seedInfoPanel.hidden;
        seedInfoPanel.hidden = isOpen;
        seedInfoBtn.setAttribute("aria-expanded", String(!isOpen));
        seedInfoBtn.classList.toggle("is-active", !isOpen);
      });
    }

    // ── Shared reset execution ──────────────────────────────────────────────────
    function executeReset() {
      var backupData = {};
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k !== RESET_BACKUP_KEY) backupData[k] = localStorage.getItem(k);
      }
      localStorage.clear();
      localStorage.setItem(RESET_BACKUP_KEY, JSON.stringify(backupData));

      var pd = window.MCCProjectData;
      var appKey = (pd && pd.tracker && pd.tracker.storageKey) || "ltm-task-tracker-v1";
      localStorage.setItem(appKey, JSON.stringify({
        seedVersion: (pd && pd.tracker && pd.tracker.seedVersion) || "1.0",
        tasks: [],
        ui: {}
      }));
      localStorage.setItem(appKey + "-project-name", "Project Name");

      location.reload();
    }

    if (cancelBtn) cancelBtn.addEventListener("click", closeResetModal);
    if (overlay) {
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) closeResetModal();
      });
    }

    if (confirmBtn) {
      confirmBtn.addEventListener("click", function () {
        executeReset();
      });
    }

    // ── Advanced section ────────────────────────────────────────────────────────
    if (advancedToggle && advancedPanel) {
      advancedToggle.addEventListener("click", function (e) {
        e.stopPropagation();
        var isOpen = !advancedPanel.hidden;
        advancedPanel.hidden = isOpen;
        advancedToggle.setAttribute("aria-expanded", String(!isOpen));
      });
    }

    if (skipResetToggle) {
      // Reflect saved preference on load
      var skipEnabled = localStorage.getItem(SKIP_RESET_CONF_KEY) === "true";
      skipResetToggle.setAttribute("aria-checked", String(skipEnabled));

      function toggleSkipReset(e) {
        e.preventDefault();
        e.stopPropagation();
        var current = skipResetToggle.getAttribute("aria-checked") === "true";
        var next = !current;
        skipResetToggle.setAttribute("aria-checked", String(next));
        localStorage.setItem(SKIP_RESET_CONF_KEY, String(next));
      }
      skipResetToggle.addEventListener("click", toggleSkipReset);
      skipResetToggle.addEventListener("keydown", function (e) {
        if (e.key === " " || e.key === "Enter") toggleSkipReset(e);
      });
    }

    // Override resetAppItem to skip the modal when the preference is set
    if (resetAppItem) {
      resetAppItem.removeEventListener("click", resetAppItem._lbmHandler);
      resetAppItem._lbmHandler = function () {
        closeMenu();
        if (localStorage.getItem(SKIP_RESET_CONF_KEY) === "true") {
          executeReset();
        } else {
          openResetModal();
        }
      };
      resetAppItem.addEventListener("click", resetAppItem._lbmHandler);
    }

    // Close on outside click
    document.addEventListener("click", function (e) {
      if (!dropdown.hidden && !btn.contains(e.target) && !dropdown.contains(e.target)) {
        closeMenu();
      }
    }, true);

    // Close on Escape — only on pages that don't have task-app.js
    // (task-app.js handles its own Escape chain and calls closeMenu itself)
    var isIndexPage = !!document.getElementById("taskList");
    if (!isIndexPage) {
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          if (overlay && !overlay.hidden) { closeResetModal(); return; }
          if (!dropdown.hidden) { closeMenu(); return; }
        }
      });
    }

    // Expose for task-app.js to call
    window._lbmAppMenu = {
      openResetModal:   openResetModal,
      closeResetModal:  closeResetModal,
      createUndoBanner: createUndoBanner
    };
  }

  // ── Post-reset undo: runs on every page load, independent of menu DOM ────────
  function initResetUndo() {
    var backup = localStorage.getItem(RESET_BACKUP_KEY);
    if (!backup) return;

    var resetUndoKeyHandler;

    var doResetUndo = function () {
      try {
        var data = JSON.parse(backup);
        Object.keys(data).forEach(function (k) { localStorage.setItem(k, data[k]); });
      } catch (_) {}
      localStorage.removeItem(RESET_BACKUP_KEY);
      location.reload();
    };

    var cleanupResetUndo = function () {
      document.removeEventListener("keydown", resetUndoKeyHandler);
    };

    createUndoBanner(
      "App reset. Undo to restore your data.",
      function () { cleanupResetUndo(); doResetUndo(); },
      function () { cleanupResetUndo(); localStorage.removeItem(RESET_BACKUP_KEY); }
    );

    // Ctrl/Cmd+Z — fires first (before task-level undo) on any page
    resetUndoKeyHandler = function (e) {
      var tag = document.activeElement ? document.activeElement.tagName : "";
      if (tag === "INPUT" || tag === "TEXTAREA" || (document.activeElement && document.activeElement.isContentEditable)) return;
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        e.stopImmediatePropagation();
        cleanupResetUndo();
        doResetUndo();
      }
    };
    document.addEventListener("keydown", resetUndoKeyHandler);
  }

  function init() {
    var brandName = document.getElementById("brandName");
    if (brandName) {
      brandName.textContent = localStorage.getItem(storageKey()) || defaultName();

      brandName.addEventListener("click", function () {
        if (brandName.contentEditable === "true") return;

        var original = brandName.textContent;
        brandName.contentEditable = "true";
        brandName.focus();

        function commit() {
          brandName.contentEditable = "false";
          var val = brandName.textContent.trim() || original;
          brandName.textContent = val;
          localStorage.setItem(storageKey(), val);
          brandName.removeEventListener("keydown", handleKey);
        }

        function handleKey(e) {
          if (e.key === "Enter") { e.preventDefault(); brandName.blur(); }
          if (e.key === "Escape") {
            brandName.removeEventListener("blur", commit);
            brandName.removeEventListener("keydown", handleKey);
            brandName.contentEditable = "false";
            brandName.textContent = original;
          }
        }

        brandName.addEventListener("blur", commit, { once: true });
        brandName.addEventListener("keydown", handleKey);
      });
    }

    initTabIndicator();
    initPageTransitions();
    initResetUndo();
    initAppMenu();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
