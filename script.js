/* ==========================================================
   Brew Haven: shared script (runs on every page)
   1. Split headlines into words
   2. Theme toggle (remembered) with circular reveal
   3. Hamburger menu
   4. Header shadow + scroll progress bar
   5. Page-to-page transition
   6. Scroll reveals + number counters
   7. Menu tabs, hero tilt, open/closed status
   8. Contact form validation
   ========================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Split headlines ---------- */
  document.querySelectorAll("[data-split]").forEach(function (el) {
    var text = el.textContent.trim();
    var words = text.split(/\s+/);
    el.setAttribute("aria-label", text);
    el.textContent = "";
    words.forEach(function (word, i) {
      var outer = document.createElement("span");
      outer.className = "w";
      outer.setAttribute("aria-hidden", "true");
      var inner = document.createElement("span");
      inner.style.setProperty("--i", i);
      inner.textContent = word;
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    el.classList.add("split");
  });

  /* ---------- 2. Theme ---------- */
  var themeBtn = document.getElementById("theme-toggle");

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function updateThemeButton() {
    if (!themeBtn) return;
    var next = currentTheme() === "dark" ? "light" : "dark";
    themeBtn.setAttribute("aria-label", "Switch to " + next + " mode");
    themeBtn.setAttribute("title", "Switch to " + next + " mode");
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch (e) { /* storage blocked: still works for this visit */ }
    updateThemeButton();
  }

  function setTheme(theme) {
    // Newer browsers: the new theme spreads out as a circle from the button
    if (document.startViewTransition && !reduceMotion && themeBtn) {
      var rect = themeBtn.getBoundingClientRect();
      var x = rect.left + rect.width / 2;
      var y = rect.top + rect.height / 2;
      var radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      var transition = document.startViewTransition(function () { applyTheme(theme); });
      transition.ready.then(function () {
        root.animate(
          { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + radius + "px at " + x + "px " + y + "px)"] },
          { duration: 650, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" }
        );
      }).catch(function () {});
      return;
    }
    // Everything else: a simple colour fade
    root.classList.add("theme-transition");
    applyTheme(theme);
    window.setTimeout(function () { root.classList.remove("theme-transition"); }, 400);
  }

  updateThemeButton();
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      setTheme(currentTheme() === "dark" ? "light" : "dark");
    });
  }

  /* ---------- 3. Hamburger menu ---------- */
  var menuBtn = document.getElementById("menu-toggle");
  var nav = document.getElementById("site-nav");

  function setMenu(open) {
    if (!menuBtn || !nav) return;
    nav.classList.toggle("open", open);
    menuBtn.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        setMenu(false);
        menuBtn.focus();
      }
    });

    document.addEventListener("click", function (e) {
      if (nav.classList.contains("open") && !e.target.closest(".site-header")) setMenu(false);
    });

    window.matchMedia("(min-width: 768px)").addEventListener("change", function (e) {
      if (e.matches) setMenu(false);
    });
  }

  /* ---------- 4. Header shadow + scroll progress ---------- */
  var header = document.querySelector(".site-header");
  var progress = document.getElementById("scroll-progress");
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || 0;
    if (header) header.classList.toggle("scrolled", y > 8);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
    }
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- 5. Page transition ---------- */
  var curtain = document.querySelector(".curtain");

  document.addEventListener("click", function (e) {
    if (!curtain || reduceMotion) return;
    var link = e.target.closest("a");
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (link.target === "_blank" || link.hasAttribute("download")) return;
    if (link.protocol !== window.location.protocol || link.host !== window.location.host) return;
    if (link.pathname === window.location.pathname) return; // same page or #anchor

    e.preventDefault();
    var href = link.href;
    curtain.classList.add("leaving");
    window.setTimeout(function () { window.location.href = href; }, 520);
  });

  // Coming back with the browser's back button: don't leave the curtain down
  window.addEventListener("pageshow", function (e) {
    if (e.persisted && curtain) curtain.classList.remove("leaving");
  });

  /* ---------- 6. Reveals + counters ---------- */
  var footerYear = document.getElementById("year");
  if (footerYear) footerYear.textContent = new Date().getFullYear();

  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = target.toLocaleString() + suffix; return; }
    var start = null;
    var duration = 1500;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toLocaleString() + suffix;
      if (t < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  var revealEls = document.querySelectorAll(".reveal, .fade, .stamps");
  var counters = document.querySelectorAll("[data-count]");

  function onReveal(el) {
    el.classList.add("in");
    el.querySelectorAll("[data-count]").forEach(runCounter);
    var boardInside = el.querySelector(".board");
    if (boardInside && boardInside.__firstShow) boardInside.__firstShow();
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        onReveal(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(onReveal);
  }

  // Counters that are not inside a reveal element
  counters.forEach(function (el) {
    if (el.closest(".reveal, .fade, .stamps")) return;
    runCounter(el);
  });

  /* ---------- 7. Menu tabs, hero tilt, open status ---------- */
  var tabsWrap = document.querySelector(".tabs");
  if (tabsWrap) {
    var tabs = Array.prototype.slice.call(tabsWrap.querySelectorAll("[role='tab']"));

    var moveIndicator = function () {
      var active = tabsWrap.querySelector("[aria-selected='true']");
      if (!active) return;
      tabsWrap.style.setProperty("--x", active.offsetLeft + "px");
      tabsWrap.style.setProperty("--w", active.offsetWidth + "px");
    };

    var showPanel = function (tab, animate) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute("aria-selected", String(selected));
        t.tabIndex = selected ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        panel.hidden = !selected;
        var list = panel.querySelector(".board-list");
        list.classList.remove("animate");
        if (selected && animate) {
          void list.offsetWidth; // restart the animation
          list.classList.add("animate");
        }
      });
      moveIndicator();
    };

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { showPanel(tab, true); });
      tab.addEventListener("keydown", function (e) {
        var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        var next = tabs[(i + dir + tabs.length) % tabs.length];
        next.focus();
        showPanel(next, true);
      });
    });

    var board = document.querySelector(".board");
    if (board) {
      board.__firstShow = function () {
        var active = tabsWrap.querySelector("[aria-selected='true']");
        if (active) showPanel(active, true);
      };
    }

    moveIndicator();
    window.addEventListener("resize", moveIndicator);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);
  }

  var hero = document.querySelector(".hero");
  var tilt = document.querySelector(".cup-tilt");
  if (hero && tilt && !reduceMotion && window.matchMedia("(hover: hover)").matches) {
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      tilt.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
      tilt.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
    });
    hero.addEventListener("pointerleave", function () {
      tilt.style.setProperty("--mx", 0);
      tilt.style.setProperty("--my", 0);
    });
  }

  var statusEl = document.getElementById("open-status");
  var statusText = document.getElementById("open-text");
  if (statusEl && statusText) {
    var now = new Date();
    var hour = now.getHours() + now.getMinutes() / 60;
    var isOpen = hour >= 7 && hour < 21;
    statusEl.classList.toggle("closed", !isOpen);
    statusText.textContent = isOpen
      ? "Open now, until 9pm"
      : hour < 7 ? "Closed, opens at 7am" : "Closed, opens tomorrow at 7am";
  }

  /* ---------- 8. Contact form validation ---------- */
  var form = document.getElementById("contact-form");
  if (!form) return;

  var NAME_MIN = 3;
  var MESSAGE_MIN = 10;
  var MESSAGE_MAX = 500;

  var EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
  var NAME_RE = /^[A-Za-zÀ-ɏ][A-Za-zÀ-ɏ\s.'-]*$/;

  // Each rule returns "" when valid, otherwise the error text
  var rules = {
    name: function (value) {
      var v = value.trim();
      if (!v) return "Enter your name.";
      if (v.length < NAME_MIN) return "Name needs at least " + NAME_MIN + " characters.";
      if (!NAME_RE.test(v)) return "Use letters, spaces, apostrophes, dots or hyphens only.";
      return "";
    },
    email: function (value) {
      var v = value.trim();
      if (!v) return "Enter your email address.";
      if (!EMAIL_RE.test(v)) return "Enter a valid email, like name@example.com.";
      return "";
    },
    message: function (value) {
      var v = value.trim();
      if (!v) return "Write a message.";
      if (v.length < MESSAGE_MIN) return "Message needs at least " + MESSAGE_MIN + " characters (" + v.length + " so far).";
      if (v.length > MESSAGE_MAX) return "Message can be up to " + MESSAGE_MAX + " characters.";
      return "";
    }
  };

  var fields = ["name", "email", "message"].map(function (id) {
    var input = document.getElementById(id);
    return {
      id: id,
      input: input,
      group: input.closest(".field"),
      error: document.getElementById(id + "-error"),
      touched: false
    };
  });

  var successBox = document.getElementById("form-success");
  var successText = document.getElementById("success-text");
  var submitBtn = form.querySelector("button[type='submit']");
  var counter = document.getElementById("message-count");

  function validateField(field) {
    var message = rules[field.id](field.input.value);
    var invalid = message !== "";
    field.error.textContent = message;
    field.group.classList.remove("invalid"); // lets the shake play again
    if (invalid) {
      void field.group.offsetWidth;
      field.group.classList.add("invalid");
    }
    field.group.classList.toggle("valid", !invalid && field.input.value.trim() !== "");
    field.input.setAttribute("aria-invalid", String(invalid));
    return !invalid;
  }

  function updateCounter() {
    if (counter) counter.textContent = document.getElementById("message").value.length + " / " + MESSAGE_MAX;
  }

  fields.forEach(function (field) {
    field.input.addEventListener("blur", function () {
      field.touched = true;
      validateField(field);
    });
    field.input.addEventListener("input", function () {
      successBox.classList.remove("show");
      if (field.touched) validateField(field);
      if (field.id === "message") updateCounter();
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    successBox.classList.remove("show");

    var firstInvalid = null;
    fields.forEach(function (field) {
      field.touched = true;
      if (!validateField(field) && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      firstInvalid.input.focus();
      return;
    }

    // Everything is valid. There is no backend, so sending is simulated.
    var firstName = document.getElementById("name").value.trim().split(/\s+/)[0];
    submitBtn.disabled = true;
    var originalLabel = submitBtn.textContent;
    submitBtn.textContent = "Sending...";

    window.setTimeout(function () {
      form.reset();
      fields.forEach(function (field) {
        field.touched = false;
        field.error.textContent = "";
        field.group.classList.remove("invalid", "valid");
        field.input.removeAttribute("aria-invalid");
      });
      updateCounter();
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
      successText.textContent = "Thanks, " + firstName + ". We'll reply within two days.";
      void successBox.offsetWidth;
      successBox.classList.add("show");
      successBox.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    }, 700);
  });

  updateCounter();
})();