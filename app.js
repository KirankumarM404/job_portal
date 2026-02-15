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
  var validRoutes = ['dashboard', 'saved', 'digest', 'settings', 'proof'];
  var defaultRoute = 'dashboard';
  var currentRoute = null; // Track active route to prevent double-nav flicker


  // ── Router ──
  function getRouteFromHash() {
    var hash = window.location.hash.replace('#/', '').replace('#', '');
    if (!hash || hash === '/' || hash === '') {
      return defaultRoute;
    }
    // Return the hash as-is — validation happens in handleHashChange
    return hash;
  }

  function navigateTo(route) {
    // Skip if already on this route — prevents fadeIn flicker on double-click
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
  }

  function handleHashChange() {
    var route = getRouteFromHash();

    // If hash is empty or root, redirect to default route
    if (!window.location.hash || window.location.hash === '#/' || window.location.hash === '#') {
      window.location.hash = '#/' + defaultRoute;
      return; // The hashchange event will fire again with the correct hash
    }

    // Invalid route → show 404 page
    if (validRoutes.indexOf(route) === -1) {
      navigateTo('not-found');
      return;
    }

    navigateTo(route);
  }

  // Listen for hash changes
  window.addEventListener('hashchange', handleHashChange);


  // ── Nav Link Clicks ──
  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      // Let the browser update the hash naturally via href
      // The hashchange listener will handle the rest
    });
  });


  // ── Hamburger Menu ──
  function closeHamburger() {
    if (navBar) {
      navBar.classList.remove('is-open');
    }
    if (hamburgerBtn) {
      hamburgerBtn.setAttribute('aria-expanded', 'false');
    }
    if (hamburgerIcon) {
      hamburgerIcon.innerHTML = '&#9776;'; // ☰
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
      hamburgerIcon.innerHTML = '&#10005;'; // ✕
    }
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', function () {
      var isOpen = navBar.classList.contains('is-open');
      if (isOpen) {
        closeHamburger();
      } else {
        openHamburger();
      }
    });
  }

  // Close hamburger when clicking outside
  document.addEventListener('click', function (e) {
    if (navBar && navBar.classList.contains('is-open')) {
      if (!navBar.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        closeHamburger();
      }
    }
  });


  // ── Toast ──
  var toastTimeout;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, 2200);
  }


  // ── Initialize ──
  handleHashChange();

})();
