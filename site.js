/* HARVEL — global interactions
   Navbar scroll state, scroll-reveal, animated counters, 3D card tilt,
   magnetic buttons, and the search overlay. Respects prefers-reduced-motion. */
(function () {
  "use strict";

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  document.addEventListener("DOMContentLoaded", function () {
    initNavbarScroll();
    initReveal();
    initCounters();
    if (hasHover && !reduced) {
      initTilt();
      initMagnetic();
    }
    initSearchOverlay();
  });

  /* ---- Navbar shrinks + solidifies on scroll ---- */
  function initNavbarScroll() {
    var nav = document.querySelector(".navbar, .main-nav");
    if (!nav) return;
    var ticking = false;
    function update() {
      if (window.scrollY > 30) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  /* ---- Auto-tag reveal targets, then observe ---- */
  function initReveal() {
    var auto = document.querySelectorAll(
      ".product-card, .category-card, .why-card, .testimonial-card, .faq-item, " +
      ".stat-num, .product-section .row, .hero-copy, .hero-visual, .section-head, " +
      ".offers-section, .category-hero .cat-copy, .category-hero-media, .pd-trust-item"
    );
    auto.forEach(function (el) {
      if (!el.classList.contains("reveal") && !el.classList.contains("reveal-left") &&
          !el.classList.contains("reveal-right") && !el.classList.contains("reveal-scale")) {
        el.classList.add("reveal");
      }
    });

    if (reduced || !("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale")
        .forEach(function (el) { el.classList.add("in-view"); });
      return;
    }

    var keyMap = new WeakMap();
    var keyCounter = 0;
    var counters = {};
    function getKey(node) {
      if (!keyMap.has(node)) keyMap.set(node, "k" + (keyCounter++));
      return keyMap.get(node);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var parent = el.parentElement;
        if (parent) {
          var key = getKey(parent);
          if (!counters[key]) counters[key] = 0;
          el.style.setProperty("--i", counters[key]);
          counters[key]++;
        }
        el.classList.add("in-view");
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale").forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---- Animated number counters (data-count-to="12500") ---- */
  function initCounters() {
    var els = document.querySelectorAll("[data-count-to]");
    if (!els.length) return;
    if (reduced || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.textContent = el.getAttribute("data-count-to") + (el.getAttribute("data-suffix") || ""); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });

    function animateCount(el) {
      var target = parseFloat(el.getAttribute("data-count-to"));
      var suffix = el.getAttribute("data-suffix") || "";
      var duration = 1400;
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = Math.floor(eased * target);
        el.textContent = value.toLocaleString() + suffix;
        if (progress < 1) window.requestAnimationFrame(step);
        else el.textContent = target.toLocaleString() + suffix;
      }
      window.requestAnimationFrame(step);
    }
  }

  /* ---- Subtle 3D tilt on product / category cards ---- */
  function initTilt() {
    var cards = document.querySelectorAll(".product-card, .category-card");
    cards.forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        var rotateX = (-y * 6).toFixed(2);
        var rotateY = (x * 8).toFixed(2);
        card.style.transform = "perspective(700px) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg) translateY(-4px)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* ---- Magnetic pull on primary buttons ---- */
  function initMagnetic() {
    var btns = document.querySelectorAll(".btn-primary, .hero-actions .btn, .final-cta .btn-primary");
    btns.forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = "translate(" + (x * 0.18).toFixed(1) + "px," + (y * 0.35).toFixed(1) + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "";
      });
    });
  }

  /* ---- Search overlay open/close ---- */
  function initSearchOverlay() {
    var trigger = document.getElementById("searchTrigger");
    var overlay = document.getElementById("searchOverlay");
    var closeBtn = document.getElementById("searchClose");
    var input = document.getElementById("searchInput");
    if (!trigger || !overlay) return;

    function open() {
      overlay.classList.add("active");
      document.body.style.overflow = "hidden";
      if (input) setTimeout(function () { input.focus(); }, 120);
    }
    function close() {
      overlay.classList.remove("active");
      document.body.style.overflow = "";
    }
    trigger.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }
})();
