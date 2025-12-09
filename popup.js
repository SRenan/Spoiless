// Load saved settings
browser.storage.local.get(['googleEnabled', 'liquipediaEnabled']).then(function(result) {
  // Default to enabled if not set
  document.getElementById('toggle-google').checked = result.googleEnabled !== false;
  document.getElementById('toggle-liquipedia').checked = result.liquipediaEnabled !== false;
});

// Save settings on toggle
document.getElementById('toggle-google').addEventListener('change', function(e) {
  browser.storage.local.set({ googleEnabled: e.target.checked });
});

document.getElementById('toggle-liquipedia').addEventListener('change', function(e) {
  browser.storage.local.set({ liquipediaEnabled: e.target.checked });
});
