/* ============================================================
   KodNest Premium Build System — App Logic
   ============================================================
   Minimal vanilla JS for interactive behaviors.
   No frameworks. No libraries. Just intent.
   ============================================================ */

(function () {
  'use strict';

  // ── DOM References ──
  const statusBadge    = document.getElementById('statusBadge');
  const stepIndicator  = document.getElementById('stepIndicator');
  const cycleStatusBtn = document.getElementById('cycleStatusBtn');
  const copyPromptBtn  = document.getElementById('copyPromptBtn');
  const promptText     = document.getElementById('promptText');
  const workedBtn      = document.getElementById('workedBtn');
  const errorBtn       = document.getElementById('errorBtn');
  const toastEl        = document.getElementById('toast');
  const proofItems     = document.querySelectorAll('.proof-item');

  // ── Status Cycle ──
  const statuses = [
    { label: 'Not Started', className: 'badge--idle' },
    { label: 'In Progress', className: 'badge--active' },
    { label: 'Shipped',     className: 'badge--shipped' }
  ];

  let currentStatusIndex = 0;
  let currentStep = 1;
  const totalSteps = 4;

  function setStatus(index) {
    const status = statuses[index];
    statusBadge.textContent = status.label;
    statusBadge.className = 'badge ' + status.className;
  }

  if (cycleStatusBtn) {
    cycleStatusBtn.addEventListener('click', function () {
      currentStatusIndex = (currentStatusIndex + 1) % statuses.length;
      setStatus(currentStatusIndex);
      showToast('Status: ' + statuses[currentStatusIndex].label);
    });
  }


  // ── Step Progress ──
  function updateStep(step) {
    if (step < 1) step = 1;
    if (step > totalSteps) step = totalSteps;
    currentStep = step;
    stepIndicator.textContent = 'Step ' + currentStep + ' / ' + totalSteps;
  }


  // ── Copy Prompt ──
  if (copyPromptBtn && promptText) {
    copyPromptBtn.addEventListener('click', function () {
      var text = promptText.textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          showToast('Prompt copied to clipboard');
        });
      } else {
        // Fallback for older browsers
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Prompt copied to clipboard');
      }
    });
  }


  // ── Action Buttons ──
  if (workedBtn) {
    workedBtn.addEventListener('click', function () {
      showToast('Marked as working');
      // Advance step
      updateStep(currentStep + 1);
      // Set status to In Progress if not already
      if (currentStatusIndex === 0) {
        currentStatusIndex = 1;
        setStatus(currentStatusIndex);
      }
    });
  }

  if (errorBtn) {
    errorBtn.addEventListener('click', function () {
      showToast('Error reported — review the build log');
    });
  }


  // ── Proof Checkboxes ──
  proofItems.forEach(function (item) {
    var checkbox = item.querySelector('input[type="checkbox"]');
    if (checkbox) {
      checkbox.addEventListener('change', function () {
        if (checkbox.checked) {
          item.classList.add('is-checked');
        } else {
          item.classList.remove('is-checked');
        }
        checkAllProof();
      });
    }
  });

  function checkAllProof() {
    var allChecked = true;
    proofItems.forEach(function (item) {
      var cb = item.querySelector('input[type="checkbox"]');
      if (cb && !cb.checked) allChecked = false;
    });
    if (allChecked && proofItems.length > 0) {
      currentStatusIndex = 2;
      setStatus(currentStatusIndex);
      showToast('All proof items verified — Shipped');
    }
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
    }, 2200);
  }

})();
