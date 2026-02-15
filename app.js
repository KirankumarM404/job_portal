/* ============================================================
   Job Notification Tracker — App Logic
   ============================================================
   Hash-based SPA router + hamburger menu toggle.
   No frameworks. No libraries. Just intent.
   ============================================================ */

(function () {
  'use strict';

  // ── DOM References ──
  var navLinks = document.querySelectorAll('.nav-link');
  var routePages = document.querySelectorAll('.route-page');
  var hamburgerBtn = document.getElementById('hamburgerBtn');
  var hamburgerIcon = document.getElementById('hamburgerIcon');
  var navBar = document.getElementById('navBar');
  var toastEl = document.getElementById('toast');

  // ── Valid routes ──
  var validRoutes = ['landing', 'dashboard', 'saved', 'digest', 'settings', 'proof'];
  var defaultRoute = 'landing';
  var currentRoute = null;  // Prevent double-nav flicker


  // ── Router ──
  function getRouteFromHash() {
    var hash = window.location.hash.replace('#/', '').replace('#', '');
    if (!hash || hash === '/' || hash === '') {
      return defaultRoute;
    }
    return hash;
  }

  function navigateTo(route) {
    // Skip if already on this route
    if (route === currentRoute) {
      closeHamburger();
      return;
    }
    currentRoute = route;

    // Hide all route pages
    routePages.forEach(function (page) {
      page.classList.remove('is-active');
    });

    // Deactivate all nav links
    navLinks.forEach(function (link) {
      link.classList.remove('is-active');
    });

    // Show the target route page
    var targetPage = document.querySelector('[data-route-page="' + route + '"]');
    if (targetPage) {
      targetPage.classList.add('is-active');
    }

    // Activate the matching nav link
    var targetLink = document.querySelector('.nav-link[data-route="' + route + '"]');
    if (targetLink) {
      targetLink.classList.add('is-active');
    }

    // Close hamburger menu if open
    closeHamburger();

    // Scroll to top on route change
    window.scrollTo(0, 0);
  }

  function handleHashChange() {
    var route = getRouteFromHash();

    // Empty / root hash → show landing page
    if (!window.location.hash || window.location.hash === '#/' || window.location.hash === '#') {
      navigateTo(defaultRoute);
      return;
    }

    // Invalid route → 404
    if (validRoutes.indexOf(route) === -1) {
      navigateTo('not-found');
      return;
    }

    navigateTo(route);
  }

  window.addEventListener('hashchange', handleHashChange);


  // ── Hamburger Menu ──
  function closeHamburger() {
    if (navBar) {
      navBar.classList.remove('is-open');
    }
    if (hamburgerBtn) {
      hamburgerBtn.setAttribute('aria-expanded', 'false');
    }
    if (hamburgerIcon) {
      hamburgerIcon.innerHTML = '&#9776;';
    }
  }

  function openHamburger() {
    if (navBar) {
      navBar.classList.add('is-open');
    }
    if (hamburgerBtn) {
      hamburgerBtn.setAttribute('aria-expanded', 'true');
    }
    if (hamburgerIcon) {
      hamburgerIcon.innerHTML = '&#10005;';
    }
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', function () {
      if (navBar.classList.contains('is-open')) {
        closeHamburger();
      } else {
        openHamburger();
      }
    });
  }

  // Close hamburger on outside click
  document.addEventListener('click', function (e) {
    if (navBar && navBar.classList.contains('is-open')) {
      if (!navBar.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        closeHamburger();
      }
    }
  });


  // ── Settings Form — Toast Feedback ──
  var savePrefsBtn = document.getElementById('savePrefsBtn');
  if (savePrefsBtn) {
    savePrefsBtn.addEventListener('click', function (e) {
      e.preventDefault();
      showToast('Preferences noted — logic will be added in the next step.');
    });
  }


  // ── Toast ──
  var toastTimeout;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, 2800);
  }


  // ── Initialize ──
  handleHashChange();

})();
