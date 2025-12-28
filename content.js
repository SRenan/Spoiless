var browser = browser || chrome;

// Check if Google Sports hiding is enabled
browser.storage.local.get('googleEnabled').then(function(result) {
  // Default to enabled if not set
  if (result.googleEnabled === false) return;

  // Hide scores by replacing with "?"
  function hideScores() {
    document.querySelectorAll('.imspo_mt__t-sc .imspo_mt__tt-w').forEach(function(el) {
      // Skip already processed elements
      if (el.classList.contains('spoiless-hidden') || el.classList.contains('spoiless-revealed')) {
        return;
      }

      var text = el.textContent.trim();
      // Only hide numeric content (scores)
      if (/^\d+$/.test(text)) {
        el.dataset.spoilessScore = text;
        el.textContent = '?';
        el.classList.add('spoiless-hidden');
      }
    });

    // Hide winner triangles
    document.querySelectorAll('.imspo_mt__triangle').forEach(function(el) {
      if (!el.classList.contains('spoiless-hidden') && !el.classList.contains('spoiless-revealed')) {
        el.classList.add('spoiless-hidden');
      }
    });

    // Hide winner styling by swapping class to loser class
    document.querySelectorAll('.imspo_mt__dt-t').forEach(function(el) {
      if (!el.dataset.spoilessWinner) {
        el.classList.remove('imspo_mt__dt-t');
        el.classList.add('imspo_mt__lt-t');
        el.dataset.spoilessWinner = 'true';
      }
    });
  }

  // Initial hide
  hideScores();

  // Watch for dynamically loaded content
  new MutationObserver(hideScores).observe(document.body, {
    childList: true,
    subtree: true
  });

  // Click to reveal
  document.addEventListener('click', function(e) {
    var target = e.target.closest('.spoiless-hidden');
    if (target && target.dataset.spoilessScore) {
      e.preventDefault();
      e.stopPropagation();
      target.textContent = target.dataset.spoilessScore;
      target.classList.remove('spoiless-hidden');
      target.classList.add('spoiless-revealed');

      // Also reveal triangles and winner styling in the same row
      var row = target.closest('tr');
      if (row) {
        row.querySelectorAll('.imspo_mt__triangle.spoiless-hidden').forEach(function(el) {
          el.classList.remove('spoiless-hidden');
          el.classList.add('spoiless-revealed');
        });
        // Restore winner class
        row.querySelectorAll('[data-spoiless-winner]').forEach(function(el) {
          el.classList.remove('imspo_mt__lt-t');
          el.classList.add('imspo_mt__dt-t');
        });
      }
    }
  }, true);
});
