/* ============================================================
   Job Notification Tracker — App Logic
   ============================================================
   Hash-based SPA router, job rendering, filters, save/apply,
   modal, hamburger menu, toast. No frameworks.
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

  // Dashboard
  var jobGrid = document.getElementById('jobGrid');
  var dashboardEmpty = document.getElementById('dashboardEmpty');
  var resultsMeta = document.getElementById('resultsMeta');

  // Saved
  var savedGrid = document.getElementById('savedGrid');
  var savedEmpty = document.getElementById('savedEmpty');
  var clearSavedBtn = document.getElementById('clearSavedBtn');

  // Filters
  var filterKeyword = document.getElementById('filterKeyword');
  var filterLocation = document.getElementById('filterLocation');
  var filterMode = document.getElementById('filterMode');
  var filterExperience = document.getElementById('filterExperience');
  var filterSource = document.getElementById('filterSource');
  var filterSort = document.getElementById('filterSort');

  // Modal
  var jobModal = document.getElementById('jobModal');
  var modalTitle = document.getElementById('modalTitle');
  var modalMeta = document.getElementById('modalMeta');
  var modalDescription = document.getElementById('modalDescription');
  var modalSkills = document.getElementById('modalSkills');
  var modalFooter = document.getElementById('modalFooter');
  var modalCloseBtn = document.getElementById('modalCloseBtn');

  // ── Constants ──
  var validRoutes = ['landing', 'dashboard', 'saved', 'digest', 'settings', 'proof'];
  var defaultRoute = 'landing';
  var currentRoute = null;
  var SAVED_KEY = 'jnt_saved_jobs';


  // ============================================================
  //  ROUTER
  // ============================================================

  function getRouteFromHash() {
    var hash = window.location.hash.replace('#/', '').replace('#', '');
    if (!hash || hash === '/' || hash === '') return defaultRoute;
    return hash;
  }

  function navigateTo(route) {
    if (route === currentRoute) {
      closeHamburger();
      return;
    }
    currentRoute = route;

    routePages.forEach(function (page) {
      page.classList.remove('is-active');
    });
    navLinks.forEach(function (link) {
      link.classList.remove('is-active');
    });

    var targetPage = document.querySelector('[data-route-page="' + route + '"]');
    if (targetPage) targetPage.classList.add('is-active');

    var targetLink = document.querySelector('.nav-link[data-route="' + route + '"]');
    if (targetLink) targetLink.classList.add('is-active');

    closeHamburger();
    window.scrollTo(0, 0);

    // Render content for specific routes
    if (route === 'dashboard') renderDashboard();
    if (route === 'saved') renderSavedPage();
  }

  function handleHashChange() {
    var route = getRouteFromHash();
    if (!window.location.hash || window.location.hash === '#/' || window.location.hash === '#') {
      navigateTo(defaultRoute);
      return;
    }
    if (validRoutes.indexOf(route) === -1) {
      navigateTo('not-found');
      return;
    }
    navigateTo(route);
  }

  window.addEventListener('hashchange', handleHashChange);


  // ============================================================
  //  HAMBURGER MENU
  // ============================================================

  function closeHamburger() {
    if (navBar) navBar.classList.remove('is-open');
    if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'false');
    if (hamburgerIcon) hamburgerIcon.innerHTML = '&#9776;';
  }

  function openHamburger() {
    if (navBar) navBar.classList.add('is-open');
    if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'true');
    if (hamburgerIcon) hamburgerIcon.innerHTML = '&#10005;';
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', function () {
      if (navBar.classList.contains('is-open')) closeHamburger();
      else openHamburger();
    });
  }

  document.addEventListener('click', function (e) {
    if (navBar && navBar.classList.contains('is-open')) {
      if (!navBar.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        closeHamburger();
      }
    }
  });


  // ============================================================
  //  SAVED JOBS — localStorage
  // ============================================================

  function getSavedIds() {
    try {
      var data = JSON.parse(localStorage.getItem(SAVED_KEY));
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function saveJobId(id) {
    var ids = getSavedIds();
    if (ids.indexOf(id) === -1) {
      ids.push(id);
      localStorage.setItem(SAVED_KEY, JSON.stringify(ids));
    }
  }

  function unsaveJobId(id) {
    var ids = getSavedIds().filter(function (i) { return i !== id; });
    localStorage.setItem(SAVED_KEY, JSON.stringify(ids));
  }

  function isJobSaved(id) {
    return getSavedIds().indexOf(id) !== -1;
  }

  function clearAllSaved() {
    localStorage.removeItem(SAVED_KEY);
  }


  // ============================================================
  //  HELPERS
  // ============================================================

  function postedLabel(days) {
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return days + ' days ago';
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function sourceBadgeClass(source) {
    return 'source-badge source-badge--' + source.toLowerCase();
  }


  // ============================================================
  //  FILTERING & SORTING
  // ============================================================

  function getFilteredJobs() {
    var keyword = (filterKeyword.value || '').toLowerCase().trim();
    var location = filterLocation.value;
    var mode = filterMode.value;
    var experience = filterExperience.value;
    var source = filterSource.value;
    var sort = filterSort.value;

    var jobs = JOB_DATA.filter(function (job) {
      // Keyword — match title or company
      if (keyword) {
        var haystack = (job.title + ' ' + job.company).toLowerCase();
        if (haystack.indexOf(keyword) === -1) return false;
      }
      if (location && job.location !== location) return false;
      if (mode && job.mode !== mode) return false;
      if (experience && job.experience !== experience) return false;
      if (source && job.source !== source) return false;
      return true;
    });

    // Sort
    if (sort === 'latest') {
      jobs.sort(function (a, b) { return a.postedDaysAgo - b.postedDaysAgo; });
    } else if (sort === 'oldest') {
      jobs.sort(function (a, b) { return b.postedDaysAgo - a.postedDaysAgo; });
    } else if (sort === 'salary-high' || sort === 'salary-low') {
      jobs.sort(function (a, b) {
        var sa = parseSalaryApprox(a.salaryRange);
        var sb = parseSalaryApprox(b.salaryRange);
        return sort === 'salary-high' ? sb - sa : sa - sb;
      });
    }

    return jobs;
  }

  // Rough salary parser — extracts first number for sorting
  function parseSalaryApprox(s) {
    if (!s) return 0;
    // Match "₹15k" → 15000, "3.6" → 360000, "10" → 1000000
    var match = s.match(/([\d.]+)/);
    if (!match) return 0;
    var num = parseFloat(match[1]);
    if (s.toLowerCase().indexOf('lpa') !== -1) return num * 100000;
    if (s.toLowerCase().indexOf('/month') !== -1) {
      // "₹40k/month" → 40 * 1000 * 12 for annual comparison
      if (s.toLowerCase().indexOf('k') !== -1) return num * 1000 * 12;
      return num * 12;
    }
    return num * 100000; // default treat as LPA
  }


  // ============================================================
  //  RENDER — Job Card HTML
  // ============================================================

  function buildJobCardHTML(job, options) {
    var saved = isJobSaved(job.id);
    var isSavedPage = options && options.savedPage;

    var html = '';
    html += '<div class="job-card" data-job-id="' + job.id + '">';

    // Header: title + source badge
    html += '  <div class="job-card__header">';
    html += '    <div>';
    html += '      <div class="job-card__title">' + escapeHtml(job.title) + '</div>';
    html += '      <div class="job-card__company">' + escapeHtml(job.company) + '</div>';
    html += '    </div>';
    html += '    <span class="' + sourceBadgeClass(job.source) + '">' + escapeHtml(job.source) + '</span>';
    html += '  </div>';

    // Meta tags
    html += '  <div class="job-card__meta">';
    html += '    <span class="job-card__tag">📍 ' + escapeHtml(job.location) + '</span>';
    html += '    <span class="job-card__tag">' + modeIcon(job.mode) + ' ' + escapeHtml(job.mode) + '</span>';
    html += '    <span class="job-card__tag">💼 ' + escapeHtml(job.experience) + '</span>';
    html += '  </div>';

    // Salary + posted
    html += '  <div style="display:flex;justify-content:space-between;align-items:center;">';
    html += '    <span class="job-card__salary">' + escapeHtml(job.salaryRange) + '</span>';
    html += '    <span class="job-card__posted">' + postedLabel(job.postedDaysAgo) + '</span>';
    html += '  </div>';

    // Actions
    html += '  <div class="job-card__actions">';
    html += '    <button class="btn btn-ghost btn-sm btn-view" data-job-id="' + job.id + '">View</button>';

    if (isSavedPage) {
      html += '  <button class="btn btn-ghost btn-sm btn-unsave" data-job-id="' + job.id + '">Unsave</button>';
    } else {
      html += '  <button class="btn btn-ghost btn-sm btn-save' + (saved ? ' is-saved' : '') + '" data-job-id="' + job.id + '">';
      html += saved ? '✓ Saved' : 'Save';
      html += '  </button>';
    }

    html += '    <a href="' + escapeHtml(job.applyUrl) + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Apply</a>';
    html += '  </div>';

    html += '</div>';
    return html;
  }

  function modeIcon(mode) {
    if (mode === 'Remote') return '🏠';
    if (mode === 'Hybrid') return '🔄';
    return '🏢';
  }


  // ============================================================
  //  RENDER — Dashboard
  // ============================================================

  function renderDashboard() {
    var jobs = getFilteredJobs();

    if (jobs.length === 0) {
      jobGrid.innerHTML = '';
      jobGrid.style.display = 'none';
      dashboardEmpty.style.display = 'flex';
      resultsMeta.textContent = 'No results found';
    } else {
      dashboardEmpty.style.display = 'none';
      jobGrid.style.display = '';

      var html = '';
      for (var i = 0; i < jobs.length; i++) {
        html += buildJobCardHTML(jobs[i], { savedPage: false });
      }
      jobGrid.innerHTML = html;
      resultsMeta.textContent = 'Showing ' + jobs.length + ' of ' + JOB_DATA.length + ' jobs';
    }

    bindCardActions(jobGrid, false);
  }


  // ============================================================
  //  RENDER — Saved Page
  // ============================================================

  function renderSavedPage() {
    var ids = getSavedIds();
    var jobs = [];

    for (var i = 0; i < JOB_DATA.length; i++) {
      if (ids.indexOf(JOB_DATA[i].id) !== -1) {
        jobs.push(JOB_DATA[i]);
      }
    }

    if (jobs.length === 0) {
      savedGrid.innerHTML = '';
      savedGrid.style.display = 'none';
      savedEmpty.style.display = 'flex';
      if (clearSavedBtn) clearSavedBtn.style.display = 'none';
    } else {
      savedEmpty.style.display = 'none';
      savedGrid.style.display = '';
      if (clearSavedBtn) clearSavedBtn.style.display = '';

      var html = '';
      for (var j = 0; j < jobs.length; j++) {
        html += buildJobCardHTML(jobs[j], { savedPage: true });
      }
      savedGrid.innerHTML = html;
    }

    bindCardActions(savedGrid, true);
  }


  // ============================================================
  //  CARD ACTIONS — View, Save, Unsave
  // ============================================================

  function bindCardActions(container, isSavedPage) {
    // View buttons
    var viewBtns = container.querySelectorAll('.btn-view');
    for (var i = 0; i < viewBtns.length; i++) {
      viewBtns[i].addEventListener('click', handleViewClick);
    }

    if (isSavedPage) {
      // Unsave buttons
      var unsaveBtns = container.querySelectorAll('.btn-unsave');
      for (var j = 0; j < unsaveBtns.length; j++) {
        unsaveBtns[j].addEventListener('click', handleUnsaveClick);
      }
    } else {
      // Save buttons
      var saveBtns = container.querySelectorAll('.btn-save');
      for (var k = 0; k < saveBtns.length; k++) {
        saveBtns[k].addEventListener('click', handleSaveClick);
      }
    }
  }

  function handleViewClick(e) {
    var jobId = parseInt(e.currentTarget.getAttribute('data-job-id'), 10);
    var job = findJobById(jobId);
    if (job) openModal(job);
  }

  function handleSaveClick(e) {
    var btn = e.currentTarget;
    var jobId = parseInt(btn.getAttribute('data-job-id'), 10);

    if (isJobSaved(jobId)) {
      unsaveJobId(jobId);
      btn.classList.remove('is-saved');
      btn.textContent = 'Save';
      showToast('Removed from saved');
    } else {
      saveJobId(jobId);
      btn.classList.add('is-saved');
      btn.textContent = '✓ Saved';
      showToast('Job saved');
    }
  }

  function handleUnsaveClick(e) {
    var btn = e.currentTarget;
    var jobId = parseInt(btn.getAttribute('data-job-id'), 10);
    unsaveJobId(jobId);
    showToast('Removed from saved');
    renderSavedPage();
  }

  function findJobById(id) {
    for (var i = 0; i < JOB_DATA.length; i++) {
      if (JOB_DATA[i].id === id) return JOB_DATA[i];
    }
    return null;
  }


  // ============================================================
  //  MODAL
  // ============================================================

  function openModal(job) {
    modalTitle.textContent = job.title + ' — ' + job.company;

    // Meta
    var metaHTML = '';
    metaHTML += '<span class="job-card__tag">📍 ' + escapeHtml(job.location) + '</span>';
    metaHTML += '<span class="job-card__tag">' + modeIcon(job.mode) + ' ' + escapeHtml(job.mode) + '</span>';
    metaHTML += '<span class="job-card__tag">💼 ' + escapeHtml(job.experience) + '</span>';
    metaHTML += '<span class="job-card__tag">💰 ' + escapeHtml(job.salaryRange) + '</span>';
    metaHTML += '<span class="' + sourceBadgeClass(job.source) + '">' + escapeHtml(job.source) + '</span>';
    metaHTML += '<span class="job-card__posted">' + postedLabel(job.postedDaysAgo) + '</span>';
    modalMeta.innerHTML = metaHTML;

    // Description
    modalDescription.textContent = job.description;

    // Skills
    var skillsHTML = '';
    for (var i = 0; i < job.skills.length; i++) {
      skillsHTML += '<span class="skill-tag">' + escapeHtml(job.skills[i]) + '</span>';
    }
    modalSkills.innerHTML = skillsHTML;

    // Footer
    var saved = isJobSaved(job.id);
    var footerHTML = '';
    footerHTML += '<button class="btn btn-ghost btn-modal-save" data-job-id="' + job.id + '">';
    footerHTML += saved ? '✓ Saved' : 'Save';
    footerHTML += '</button>';
    footerHTML += '<a href="' + escapeHtml(job.applyUrl) + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Apply Now →</a>';
    modalFooter.innerHTML = footerHTML;

    // Bind modal save button
    var modalSaveBtn = modalFooter.querySelector('.btn-modal-save');
    if (modalSaveBtn) {
      if (saved) modalSaveBtn.classList.add('is-saved');
      modalSaveBtn.addEventListener('click', function () {
        var jid = parseInt(this.getAttribute('data-job-id'), 10);
        if (isJobSaved(jid)) {
          unsaveJobId(jid);
          this.classList.remove('is-saved');
          this.textContent = 'Save';
          showToast('Removed from saved');
        } else {
          saveJobId(jid);
          this.classList.add('is-saved');
          this.textContent = '✓ Saved';
          showToast('Job saved');
        }
        // Sync dashboard save buttons
        syncSaveButtons(jid);
      });
    }

    jobModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    jobModal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function syncSaveButtons(jobId) {
    var saved = isJobSaved(jobId);
    var btns = document.querySelectorAll('.btn-save[data-job-id="' + jobId + '"]');
    for (var i = 0; i < btns.length; i++) {
      if (saved) {
        btns[i].classList.add('is-saved');
        btns[i].textContent = '✓ Saved';
      } else {
        btns[i].classList.remove('is-saved');
        btns[i].textContent = 'Save';
      }
    }
  }

  // Modal close handlers
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }

  if (jobModal) {
    jobModal.addEventListener('click', function (e) {
      if (e.target === jobModal) closeModal();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && jobModal.classList.contains('is-open')) {
      closeModal();
    }
  });


  // ============================================================
  //  FILTER EVENT LISTENERS
  // ============================================================

  var filterDebounceTimer;

  function handleFilterChange() {
    clearTimeout(filterDebounceTimer);
    filterDebounceTimer = setTimeout(function () {
      if (currentRoute === 'dashboard') renderDashboard();
    }, 150);
  }

  if (filterKeyword) filterKeyword.addEventListener('input', handleFilterChange);
  if (filterLocation) filterLocation.addEventListener('change', handleFilterChange);
  if (filterMode) filterMode.addEventListener('change', handleFilterChange);
  if (filterExperience) filterExperience.addEventListener('change', handleFilterChange);
  if (filterSource) filterSource.addEventListener('change', handleFilterChange);
  if (filterSort) filterSort.addEventListener('change', handleFilterChange);


  // ============================================================
  //  CLEAR SAVED
  // ============================================================

  if (clearSavedBtn) {
    clearSavedBtn.addEventListener('click', function () {
      clearAllSaved();
      showToast('All saved jobs cleared');
      renderSavedPage();
    });
  }


  // ============================================================
  //  SETTINGS — Save Preferences Toast
  // ============================================================

  var savePrefsBtn = document.getElementById('savePrefsBtn');
  if (savePrefsBtn) {
    savePrefsBtn.addEventListener('click', function (e) {
      e.preventDefault();
      showToast('Preferences noted — logic will be added in the next step.');
    });
  }


  // ============================================================
  //  TOAST
  // ============================================================

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


  // ============================================================
  //  INITIALIZE
  // ============================================================

  handleHashChange();

})();
