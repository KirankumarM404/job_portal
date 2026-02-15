/* ============================================================
   Job Notification Tracker — App Logic
   ============================================================
   Hash-based SPA router, job rendering, filters, save/apply,
   modal, hamburger menu, toast, PREFERENCES, MATCH SCORING.
   No frameworks.
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
  var emptyTitle = document.getElementById('emptyTitle');
  var emptyBody = document.getElementById('emptyBody');
  var resultsMeta = document.getElementById('resultsMeta');
  var prefsBanner = document.getElementById('prefsBanner');

  // Saved
  var savedGrid = document.getElementById('savedGrid');
  var savedEmpty = document.getElementById('savedEmpty');
  var clearSavedBtn = document.getElementById('clearSavedBtn');

  // Digest
  var digestNoPrefs = document.getElementById('digestNoPrefs');
  var digestGenerate = document.getElementById('digestGenerate');
  var digestCard = document.getElementById('digestCard');
  var digestBody = document.getElementById('digestBody');
  var digestDate = document.getElementById('digestDate');
  var digestNoMatches = document.getElementById('digestNoMatches');
  var generateDigestBtn = document.getElementById('generateDigestBtn');
  var copyDigestBtn = document.getElementById('copyDigestBtn');
  var emailDigestBtn = document.getElementById('emailDigestBtn');

  // Filters
  var filterKeyword = document.getElementById('filterKeyword');
  var filterLocation = document.getElementById('filterLocation');
  var filterMode = document.getElementById('filterMode');
  var filterExperience = document.getElementById('filterExperience');
  var filterSource = document.getElementById('filterSource');
  var filterSort = document.getElementById('filterSort');
  var matchToggle = document.getElementById('matchToggle');
  var matchToggleWrap = document.getElementById('matchToggleWrap');

  // Modal
  var jobModal = document.getElementById('jobModal');
  var modalTitle = document.getElementById('modalTitle');
  var modalMeta = document.getElementById('modalMeta');
  var modalDescription = document.getElementById('modalDescription');
  var modalSkills = document.getElementById('modalSkills');
  var modalFooter = document.getElementById('modalFooter');
  var modalCloseBtn = document.getElementById('modalCloseBtn');

  // Settings
  var settingsForm = document.getElementById('settingsForm');
  var roleKeywordsInput = document.getElementById('roleKeywords');
  var experienceLevelSelect = document.getElementById('experienceLevel');
  var prefSkillsInput = document.getElementById('prefSkills');
  var minMatchScoreSlider = document.getElementById('minMatchScore');
  var sliderValueDisplay = document.getElementById('sliderValue');
  var savePrefsBtn = document.getElementById('savePrefsBtn');
  var clearPrefsBtn = document.getElementById('clearPrefsBtn');

  // ── Constants ──
  var validRoutes = ['landing', 'dashboard', 'saved', 'digest', 'settings', 'proof'];
  var defaultRoute = 'landing';
  var currentRoute = null;
  var SAVED_KEY = 'jnt_saved_jobs';
  var PREFS_KEY = 'jobTrackerPreferences';

  // Cached scores — recalculated per render cycle
  var scoreCache = {};


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
    if (route === 'digest') renderDigestPage();
    if (route === 'settings') prefillSettingsForm();
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
  //  PREFERENCES — localStorage
  // ============================================================

  function getPreferences() {
    try {
      var data = JSON.parse(localStorage.getItem(PREFS_KEY));
      return (data && typeof data === 'object') ? data : null;
    } catch (e) {
      return null;
    }
  }

  function savePreferences(prefs) {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }

  function clearPreferences() {
    localStorage.removeItem(PREFS_KEY);
  }

  function hasPreferences() {
    return getPreferences() !== null;
  }

  /**
   * Read current settings form values and return a prefs object.
   */
  function readFormPreferences() {
    var prefs = {};

    // Role keywords
    prefs.roleKeywords = parseCSV(roleKeywordsInput ? roleKeywordsInput.value : '');

    // Locations (checkboxes)
    prefs.preferredLocations = getCheckedValues('prefLocation');

    // Modes (checkboxes)
    prefs.preferredModes = getCheckedValues('prefMode');

    // Experience level (dropdown)
    prefs.experienceLevel = experienceLevelSelect ? experienceLevelSelect.value : '';

    // Skills
    prefs.skills = parseCSV(prefSkillsInput ? prefSkillsInput.value : '');

    // Min match score
    prefs.minMatchScore = minMatchScoreSlider ? parseInt(minMatchScoreSlider.value, 10) : 40;

    return prefs;
  }

  /**
   * Prefill settings form from stored preferences.
   */
  function prefillSettingsForm() {
    var prefs = getPreferences();
    if (!prefs) return;

    // Role keywords
    if (roleKeywordsInput && prefs.roleKeywords) {
      roleKeywordsInput.value = prefs.roleKeywords.join(', ');
    }

    // Locations checkboxes
    if (prefs.preferredLocations) {
      setCheckedValues('prefLocation', prefs.preferredLocations);
    }

    // Modes checkboxes
    if (prefs.preferredModes) {
      setCheckedValues('prefMode', prefs.preferredModes);
    }

    // Experience level
    if (experienceLevelSelect && prefs.experienceLevel) {
      experienceLevelSelect.value = prefs.experienceLevel;
    }

    // Skills
    if (prefSkillsInput && prefs.skills) {
      prefSkillsInput.value = prefs.skills.join(', ');
    }

    // Min match score slider
    if (minMatchScoreSlider && typeof prefs.minMatchScore === 'number') {
      minMatchScoreSlider.value = prefs.minMatchScore;
      if (sliderValueDisplay) sliderValueDisplay.textContent = prefs.minMatchScore;
    }
  }

  /**
   * Reset all settings form fields to defaults.
   */
  function resetSettingsForm() {
    if (roleKeywordsInput) roleKeywordsInput.value = '';
    if (prefSkillsInput) prefSkillsInput.value = '';
    if (experienceLevelSelect) experienceLevelSelect.selectedIndex = 0;
    if (minMatchScoreSlider) {
      minMatchScoreSlider.value = 40;
      if (sliderValueDisplay) sliderValueDisplay.textContent = '40';
    }
    clearCheckedValues('prefLocation');
    clearCheckedValues('prefMode');
  }


  // ============================================================
  //  MATCH SCORE ENGINE
  // ============================================================

  /**
   * Experience level mapping: settings value → matching job experience values.
   */
  var EXP_MAP = {
    'intern': ['Fresher'],
    'junior': ['Fresher', '0-1'],
    'mid': ['1-3', '3-5'],
    'senior': ['3-5'],
    'lead': ['3-5']
  };

  /**
   * Compute deterministic match score for a job against preferences.
   * Rules:
   *   +25  any roleKeyword in job.title (case-insensitive)
   *   +15  any roleKeyword in job.description (only if NOT already matched in title scoring)
   *   +15  job.location in preferredLocations
   *   +10  job.mode in preferredModes
   *   +10  job.experience matches experienceLevel (mapped)
   *   +15  any overlap between job.skills and user.skills
   *   +5   postedDaysAgo <= 2
   *   +5   source === "LinkedIn"
   *   Cap at 100.
   */
  function computeMatchScore(job, prefs) {
    if (!prefs) return 0;

    var score = 0;
    var titleLower = job.title.toLowerCase();
    var descLower = job.description.toLowerCase();

    // +25 roleKeyword in title
    var titleMatched = false;
    if (prefs.roleKeywords && prefs.roleKeywords.length > 0) {
      for (var i = 0; i < prefs.roleKeywords.length; i++) {
        var kw = prefs.roleKeywords[i].toLowerCase();
        if (kw && titleLower.indexOf(kw) !== -1) {
          titleMatched = true;
          break;
        }
      }
      if (titleMatched) score += 25;
    }

    // +15 roleKeyword in description (only if NOT already title-matched)
    if (!titleMatched && prefs.roleKeywords && prefs.roleKeywords.length > 0) {
      for (var d = 0; d < prefs.roleKeywords.length; d++) {
        var dkw = prefs.roleKeywords[d].toLowerCase();
        if (dkw && descLower.indexOf(dkw) !== -1) {
          score += 15;
          break;
        }
      }
    }

    // +15 location match
    if (prefs.preferredLocations && prefs.preferredLocations.length > 0) {
      if (prefs.preferredLocations.indexOf(job.location) !== -1) {
        score += 15;
      }
    }

    // +10 mode match
    if (prefs.preferredModes && prefs.preferredModes.length > 0) {
      if (prefs.preferredModes.indexOf(job.mode) !== -1) {
        score += 10;
      }
    }

    // +10 experience match (mapped)
    if (prefs.experienceLevel && EXP_MAP[prefs.experienceLevel]) {
      var expValues = EXP_MAP[prefs.experienceLevel];
      if (expValues.indexOf(job.experience) !== -1) {
        score += 10;
      }
    }

    // +15 skills overlap (any match)
    if (prefs.skills && prefs.skills.length > 0 && job.skills && job.skills.length > 0) {
      var userSkillsLower = prefs.skills.map(function (s) { return s.toLowerCase(); });
      var matched = false;
      for (var s = 0; s < job.skills.length; s++) {
        if (userSkillsLower.indexOf(job.skills[s].toLowerCase()) !== -1) {
          matched = true;
          break;
        }
      }
      if (matched) score += 15;
    }

    // +5 fresh posting
    if (job.postedDaysAgo <= 2) {
      score += 5;
    }

    // +5 LinkedIn source
    if (job.source === 'LinkedIn') {
      score += 5;
    }

    // Cap at 100
    return Math.min(score, 100);
  }

  /**
   * Rebuild score cache for all jobs. Called once per render.
   */
  function rebuildScoreCache() {
    scoreCache = {};
    var prefs = getPreferences();
    if (!prefs) return;

    for (var i = 0; i < JOB_DATA.length; i++) {
      scoreCache[JOB_DATA[i].id] = computeMatchScore(JOB_DATA[i], prefs);
    }
  }

  /**
   * Get the score badge tier class suffix.
   */
  function scoreTier(score) {
    if (score >= 80) return 'green';
    if (score >= 60) return 'amber';
    if (score >= 40) return 'neutral';
    return 'grey';
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

  function parseCSV(str) {
    if (!str) return [];
    return str.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
  }

  function getCheckedValues(name) {
    var checked = [];
    var boxes = document.querySelectorAll('input[name="' + name + '"]:checked');
    for (var i = 0; i < boxes.length; i++) {
      checked.push(boxes[i].value);
    }
    return checked;
  }

  function setCheckedValues(name, values) {
    var boxes = document.querySelectorAll('input[name="' + name + '"]');
    for (var i = 0; i < boxes.length; i++) {
      boxes[i].checked = values.indexOf(boxes[i].value) !== -1;
    }
  }

  function clearCheckedValues(name) {
    var boxes = document.querySelectorAll('input[name="' + name + '"]');
    for (var i = 0; i < boxes.length; i++) {
      boxes[i].checked = false;
    }
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
    var thresholdOn = matchToggle && matchToggle.checked;
    var prefs = getPreferences();
    var threshold = (prefs && typeof prefs.minMatchScore === 'number') ? prefs.minMatchScore : 40;

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

      // Threshold filter — only when toggle is on AND prefs exist
      if (thresholdOn && prefs) {
        var jobScore = (typeof scoreCache[job.id] === 'number') ? scoreCache[job.id] : 0;
        if (jobScore < threshold) return false;
      }

      return true;
    });

    // Sort
    if (sort === 'latest') {
      jobs.sort(function (a, b) { return a.postedDaysAgo - b.postedDaysAgo; });
    } else if (sort === 'oldest') {
      jobs.sort(function (a, b) { return b.postedDaysAgo - a.postedDaysAgo; });
    } else if (sort === 'match-score') {
      jobs.sort(function (a, b) {
        var sa = (typeof scoreCache[a.id] === 'number') ? scoreCache[a.id] : 0;
        var sb = (typeof scoreCache[b.id] === 'number') ? scoreCache[b.id] : 0;
        return sb - sa;
      });
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
    var match = s.match(/([\d.]+)/);
    if (!match) return 0;
    var num = parseFloat(match[1]);
    if (s.toLowerCase().indexOf('lpa') !== -1) return num * 100000;
    if (s.toLowerCase().indexOf('/month') !== -1) {
      if (s.toLowerCase().indexOf('k') !== -1) return num * 1000 * 12;
      return num * 12;
    }
    return num * 100000;
  }


  // ============================================================
  //  RENDER — Job Card HTML
  // ============================================================

  function buildJobCardHTML(job, options) {
    var saved = isJobSaved(job.id);
    var isSavedPage = options && options.savedPage;
    var showScore = hasPreferences();
    var score = showScore ? ((typeof scoreCache[job.id] === 'number') ? scoreCache[job.id] : 0) : 0;

    var html = '';
    html += '<div class="job-card" data-job-id="' + job.id + '">';

    // Header: title + score badge + source badge
    html += '  <div class="job-card__header">';
    html += '    <div>';
    html += '      <div class="job-card__title">' + escapeHtml(job.title) + '</div>';
    html += '      <div class="job-card__company">' + escapeHtml(job.company) + '</div>';
    html += '    </div>';
    html += '    <div style="display:flex;align-items:center;gap:6px;">';
    if (showScore) {
      html += '      <span class="score-badge score-badge--' + scoreTier(score) + '">' + score + '</span>';
    }
    html += '      <span class="' + sourceBadgeClass(job.source) + '">' + escapeHtml(job.source) + '</span>';
    html += '    </div>';
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
    // Rebuild score cache once per render
    rebuildScoreCache();

    var prefsExist = hasPreferences();

    // Show/hide preferences banner
    if (prefsBanner) {
      prefsBanner.style.display = prefsExist ? 'none' : 'flex';
    }

    // Show/hide match toggle
    if (matchToggleWrap) {
      matchToggleWrap.style.display = prefsExist ? '' : 'none';
    }

    var jobs = getFilteredJobs();
    var thresholdOn = matchToggle && matchToggle.checked;

    if (jobs.length === 0) {
      jobGrid.innerHTML = '';
      jobGrid.style.display = 'none';
      dashboardEmpty.style.display = 'flex';

      // Contextual empty state
      if (thresholdOn && prefsExist) {
        if (emptyTitle) emptyTitle.textContent = 'No roles match your criteria';
        if (emptyBody) emptyBody.textContent = 'Adjust filters or lower your match threshold in Settings.';
      } else {
        if (emptyTitle) emptyTitle.textContent = 'No matching jobs';
        if (emptyBody) emptyBody.textContent = 'Try adjusting your filters to see more results.';
      }
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

      // Rebuild scores for saved page too
      rebuildScoreCache();

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
    var viewBtns = container.querySelectorAll('.btn-view');
    for (var i = 0; i < viewBtns.length; i++) {
      viewBtns[i].addEventListener('click', handleViewClick);
    }

    if (isSavedPage) {
      var unsaveBtns = container.querySelectorAll('.btn-unsave');
      for (var j = 0; j < unsaveBtns.length; j++) {
        unsaveBtns[j].addEventListener('click', handleUnsaveClick);
      }
    } else {
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
    var showScore = hasPreferences();
    var score = showScore ? ((typeof scoreCache[job.id] === 'number') ? scoreCache[job.id] : 0) : 0;

    // Title (with score if available)
    if (showScore) {
      modalTitle.innerHTML = escapeHtml(job.title) + ' — ' + escapeHtml(job.company) +
        ' <span class="score-badge score-badge--' + scoreTier(score) + '" style="margin-left:8px;vertical-align:middle;">' + score + '</span>';
    } else {
      modalTitle.textContent = job.title + ' — ' + job.company;
    }

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
  if (matchToggle) matchToggle.addEventListener('change', handleFilterChange);


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
  //  SETTINGS — Save / Clear Preferences
  // ============================================================

  if (savePrefsBtn) {
    savePrefsBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var prefs = readFormPreferences();
      savePreferences(prefs);
      showToast('Preferences saved — scores will update on Dashboard.');
      // Invalidate cache so next dashboard render recalculates
      scoreCache = {};
    });
  }

  if (clearPrefsBtn) {
    clearPrefsBtn.addEventListener('click', function () {
      clearPreferences();
      resetSettingsForm();
      scoreCache = {};
      showToast('Preferences cleared.');
    });
  }

  // Live slider value update
  if (minMatchScoreSlider && sliderValueDisplay) {
    minMatchScoreSlider.addEventListener('input', function () {
      sliderValueDisplay.textContent = this.value;
    });
  }


  // ============================================================
  //  DIGEST ENGINE
  // ============================================================

  var DIGEST_PREFIX = 'jobTrackerDigest_';

  function todayKey() {
    var d = new Date();
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return DIGEST_PREFIX + yyyy + '-' + mm + '-' + dd;
  }

  function todayLabel() {
    var d = new Date();
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('en-IN', options);
  }

  function getStoredDigest() {
    try {
      var data = JSON.parse(localStorage.getItem(todayKey()));
      return Array.isArray(data) ? data : null;
    } catch (e) {
      return null;
    }
  }

  function storeDigest(digestJobs) {
    localStorage.setItem(todayKey(), JSON.stringify(digestJobs));
  }

  /**
   * Generate digest: top 10 jobs sorted by matchScore desc, then postedDaysAgo asc.
   */
  function generateDigest() {
    rebuildScoreCache();
    var prefs = getPreferences();
    if (!prefs) return [];

    // Score all jobs and create scored copies
    var scored = [];
    for (var i = 0; i < JOB_DATA.length; i++) {
      var job = JOB_DATA[i];
      var score = (typeof scoreCache[job.id] === 'number') ? scoreCache[job.id] : 0;
      scored.push({ job: job, score: score });
    }

    // Sort: matchScore desc, then postedDaysAgo asc
    scored.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.job.postedDaysAgo - b.job.postedDaysAgo;
    });

    // Filter out zero-score jobs (no match at all)
    scored = scored.filter(function (item) { return item.score > 0; });

    // Take top 10
    var top10 = scored.slice(0, 10);

    // Convert to storable format
    var digestData = top10.map(function (item) {
      return {
        id: item.job.id,
        title: item.job.title,
        company: item.job.company,
        location: item.job.location,
        experience: item.job.experience,
        matchScore: item.score,
        applyUrl: item.job.applyUrl
      };
    });

    return digestData;
  }

  /**
   * Render the digest page based on current state.
   */
  function renderDigestPage() {
    // Hide all digest sections first
    if (digestNoPrefs) digestNoPrefs.style.display = 'none';
    if (digestGenerate) digestGenerate.style.display = 'none';
    if (digestCard) digestCard.style.display = 'none';
    if (digestNoMatches) digestNoMatches.style.display = 'none';

    // No preferences → blocking state
    if (!hasPreferences()) {
      if (digestNoPrefs) digestNoPrefs.style.display = 'flex';
      return;
    }

    // Check if digest already exists for today
    var existing = getStoredDigest();
    if (existing) {
      renderDigestCard(existing);
      return;
    }

    // Show generate button
    if (digestGenerate) digestGenerate.style.display = 'block';
  }

  /**
   * Render the email-style digest card.
   */
  function renderDigestCard(digestData) {
    if (!digestData || digestData.length === 0) {
      if (digestNoMatches) digestNoMatches.style.display = 'flex';
      return;
    }

    // Date
    if (digestDate) digestDate.textContent = todayLabel();

    // Build rows
    var html = '';
    for (var i = 0; i < digestData.length; i++) {
      var item = digestData[i];
      var tier = scoreTier(item.matchScore);
      html += '<div class="digest-row">';
      html += '  <span class="digest-row__rank">' + (i + 1) + '</span>';
      html += '  <div class="digest-row__info">';
      html += '    <div class="digest-row__title">' + escapeHtml(item.title) + '</div>';
      html += '    <div class="digest-row__meta">' + escapeHtml(item.company) + ' · ' + escapeHtml(item.location) + ' · ' + escapeHtml(item.experience) + '</div>';
      html += '  </div>';
      html += '  <div class="digest-row__actions">';
      html += '    <span class="score-badge score-badge--' + tier + '">' + item.matchScore + '</span>';
      html += '    <a href="' + escapeHtml(item.applyUrl) + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Apply</a>';
      html += '  </div>';
      html += '</div>';
    }
    if (digestBody) digestBody.innerHTML = html;

    // Show card, hide generate button
    if (digestGenerate) digestGenerate.style.display = 'none';
    if (digestCard) digestCard.style.display = 'block';
  }

  /**
   * Build plain-text version of digest for copy/email.
   */
  function digestToPlainText(digestData) {
    var lines = [];
    lines.push('Top 10 Jobs For You — 9AM Digest');
    lines.push(todayLabel());
    lines.push('─────────────────────────────────');
    lines.push('');

    for (var i = 0; i < digestData.length; i++) {
      var item = digestData[i];
      lines.push((i + 1) + '. ' + item.title + ' — ' + item.company);
      lines.push('   ' + item.location + ' | ' + item.experience + ' | Score: ' + item.matchScore);
      lines.push('   Apply: ' + item.applyUrl);
      lines.push('');
    }

    lines.push('─────────────────────────────────');
    lines.push('Generated by Job Notification Tracker');
    return lines.join('\n');
  }

  // Generate Digest Button
  if (generateDigestBtn) {
    generateDigestBtn.addEventListener('click', function () {
      var digestData = generateDigest();
      if (digestData.length === 0) {
        if (digestGenerate) digestGenerate.style.display = 'none';
        if (digestNoMatches) digestNoMatches.style.display = 'flex';
        showToast('No matching roles found for today\'s digest.');
        return;
      }
      storeDigest(digestData);
      renderDigestCard(digestData);
      showToast('Digest generated — top ' + digestData.length + ' matches.');
    });
  }

  // Copy Digest to Clipboard
  if (copyDigestBtn) {
    copyDigestBtn.addEventListener('click', function () {
      var digestData = getStoredDigest();
      if (!digestData) return;
      var text = digestToPlainText(digestData);
      navigator.clipboard.writeText(text).then(function () {
        showToast('Digest copied to clipboard.');
      }).catch(function () {
        // Fallback for older browsers
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Digest copied to clipboard.');
      });
    });
  }

  // Create Email Draft
  if (emailDigestBtn) {
    emailDigestBtn.addEventListener('click', function () {
      var digestData = getStoredDigest();
      if (!digestData) return;
      var text = digestToPlainText(digestData);
      var subject = encodeURIComponent('My 9AM Job Digest');
      var body = encodeURIComponent(text);
      window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
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
