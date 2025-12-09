// Liquipedia spoiler-free VOD table
// Extracts matches with VOD links and displays them grouped by section

// Check if Liquipedia hiding is enabled
browser.storage.local.get('liquipediaEnabled').then(function(result) {
  // Default to enabled if not set
  if (result.liquipediaEnabled === false) return;

  initSpoiless();
});

function initSpoiless() {

// Helper to create elements
function el(tag, className, text) {
  var element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function buildVodTable() {
  // Don't rebuild if already exists
  if (document.querySelector('.spoiless-vod-table')) return;

  // Find section for an element by traversing DOM backwards to find preceding h2/h3
  function getSection(elem) {
    // First, find the bracket container (the popup might be detached)
    var bracket = elem.closest('.brkts-bracket');
    var searchFrom = bracket || elem;

    // Walk backwards through previous siblings and parents to find nearest h2/h3
    var current = searchFrom;
    while (current) {
      // Check previous siblings
      var sibling = current.previousElementSibling;
      while (sibling) {
        // Check if sibling is or contains a header
        if (sibling.matches('h2, h3')) {
          var headline = sibling.querySelector('.mw-headline');
          return headline ? headline.textContent.trim() : sibling.textContent.trim();
        }
        // Check inside sibling for headers (last one in document order)
        var headers = sibling.querySelectorAll('h2, h3');
        if (headers.length > 0) {
          var lastHeader = headers[headers.length - 1];
          var hl = lastHeader.querySelector('.mw-headline');
          return hl ? hl.textContent.trim() : lastHeader.textContent.trim();
        }
        sibling = sibling.previousElementSibling;
      }
      // Move up to parent
      current = current.parentElement;
    }
    return 'Other';
  }

  // Group matches by section
  var sections = {};
  var processedPopups = new WeakMap(); // Track popup -> match mapping

  // Find all VOD links
  document.querySelectorAll('.plainlinks.vodlink').forEach(function(vodLink) {
    var popup = vodLink.closest('.brkts-popup');
    if (!popup) return;

    // Get section
    var section = getSection(popup);

    // Initialize section if needed
    if (!sections[section]) {
      sections[section] = [];
    }

    // Get players from header
    var opponents = popup.querySelectorAll('.match-info-header-opponent');
    if (opponents.length < 2) return;

    var player1 = opponents[0].textContent.trim();
    var player2 = opponents[1].textContent.trim();

    // Get scores
    var scoreHolder = popup.querySelector('.match-info-header-scoreholder-upper');
    var score = scoreHolder ? scoreHolder.textContent.trim() : '';
    var scoreMatch = score.match(/(\d+)\s*(?:–|-|:)\s*(\d+)/);
    var score1 = scoreMatch ? scoreMatch[1] : '?';
    var score2 = scoreMatch ? scoreMatch[2] : '?';

    if (score1 === '?' || score2 === '?') {
      var scoreEls = popup.querySelectorAll('.brkts-opponent-score-inner');
      if (scoreEls.length >= 2) {
        score1 = scoreEls[0].textContent.trim() || '?';
        score2 = scoreEls[1].textContent.trim() || '?';
      }
    }

    // Get VOD link
    var link = vodLink.querySelector('a');
    var vodUrl = link ? link.href : null;
    var vodText = link ? (link.title || 'VOD') : 'VOD';

    if (!vodUrl) return;

    // Check if we've already created a match for this popup
    if (processedPopups.has(popup)) {
      // Add VOD to existing match
      processedPopups.get(popup).vods.push({ url: vodUrl, text: vodText });
    } else {
      // Create new match
      var match = {
        player1: player1,
        player2: player2,
        score1: score1,
        score2: score2,
        vods: [{ url: vodUrl, text: vodText }]
      };
      sections[section].push(match);
      processedPopups.set(popup, match);
    }
  });

  // Only keep sections with matches
  var sectionNames = Object.keys(sections).filter(function(s) {
    return sections[s].length > 0;
  });

  // Find max VODs across all matches
  var maxVods = 1;
  sectionNames.forEach(function(sectionName) {
    sections[sectionName].forEach(function(match) {
      if (match.vods.length > maxVods) {
        maxVods = match.vods.length;
      }
    });
  });

  // Build container
  var container = el('div', 'spoiless-vod-table');

  // Show warning if no VODs found
  if (sectionNames.length === 0) {
    container.appendChild(el('h3', null, 'Spoiler-Free VOD List'));
    container.appendChild(el('p', 'spoiless-warning', 'No VODs found. Matches may not have been played yet, or VODs have not been linked.'));
    container.appendChild(el('p', 'spoiless-warning', 'Scroll down at your own risk!'));

    var content = document.querySelector('.mw-parser-output') || document.querySelector('#mw-content-text') || document.body;
    content.insertBefore(container, content.firstChild);
    return;
  }

  // Build header
  container.appendChild(el('h3', null, 'Spoiler-Free VOD List'));

  // Build sections
  sectionNames.forEach(function(sectionName) {
    var matches = sections[sectionName];

    var sectionDiv = el('div', 'spoiless-section');
    sectionDiv.appendChild(el('h4', null, sectionName));

    var table = el('table');
    var thead = el('thead');
    var headerRow = el('tr');
    headerRow.appendChild(el('th', null, 'Player 1'));
    headerRow.appendChild(el('th', null, 'Score'));
    headerRow.appendChild(el('th', null, 'Player 2'));
    headerRow.appendChild(el('th', null, 'VODs'));
    thead.appendChild(headerRow);
    table.appendChild(thead);

    var tbody = el('tbody');

    matches.forEach(function(match) {
      var row = el('tr');

      // Player 1
      var td1 = el('td');
      var player1Span = el('span', 'spoiless-player', '???');
      player1Span.dataset.name = match.player1;
      td1.appendChild(player1Span);
      row.appendChild(td1);

      // Score
      var tdScore = el('td');
      var scoreSpan = el('span', 'spoiless-score', '? - ?');
      scoreSpan.dataset.score = match.score1 + ' - ' + match.score2;
      tdScore.appendChild(scoreSpan);
      row.appendChild(tdScore);

      // Player 2
      var td2 = el('td');
      var player2Span = el('span', 'spoiless-player', '???');
      player2Span.dataset.name = match.player2;
      td2.appendChild(player2Span);
      row.appendChild(td2);

      // VODs
      var tdVods = el('td', 'spoiless-vods');
      for (var i = 0; i < maxVods; i++) {
        var vod = match.vods[i];
        if (i === 0 && vod) {
          // First VOD is always visible
          var vodLink = el('a', 'spoiless-vod-link', 'G1');
          vodLink.href = vod.url;
          vodLink.target = '_blank';
          tdVods.appendChild(vodLink);
        } else {
          // Subsequent VODs are hidden
          var vodSpan = el('span', 'spoiless-vod-hidden', '?');
          vodSpan.dataset.url = vod ? vod.url : '';
          vodSpan.dataset.game = String(i + 1);
          tdVods.appendChild(vodSpan);
        }
      }
      row.appendChild(tdVods);

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    sectionDiv.appendChild(table);
    container.appendChild(sectionDiv);
  });

  container.appendChild(el('p', 'spoiless-hint', 'Click to reveal players or scores'));

  // Insert at top of content
  var content = document.querySelector('.mw-parser-output') || document.querySelector('#mw-content-text') || document.body;
  content.insertBefore(container, content.firstChild);
}

// Run after page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', buildVodTable);
} else {
  buildVodTable();
}

// Also watch for dynamic content
new MutationObserver(buildVodTable).observe(document.body, {
  childList: true,
  subtree: true
});

// Click to reveal player names, scores, or VODs
document.addEventListener('click', function(e) {
  var player = e.target.closest('.spoiless-player');
  if (player && player.dataset.name && !player.classList.contains('spoiless-revealed')) {
    player.textContent = player.dataset.name;
    player.classList.add('spoiless-revealed');
    return;
  }

  var score = e.target.closest('.spoiless-score');
  if (score && score.dataset.score && !score.classList.contains('spoiless-revealed')) {
    score.textContent = score.dataset.score;
    score.classList.add('spoiless-revealed');
    return;
  }

  var vodHidden = e.target.closest('.spoiless-vod-hidden');
  if (vodHidden && !vodHidden.classList.contains('spoiless-revealed')) {
    var url = vodHidden.dataset.url;
    var gameNum = vodHidden.dataset.game;
    if (url) {
      // Replace with actual link
      var link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.className = 'spoiless-vod-link';
      link.textContent = 'G' + gameNum;
      vodHidden.parentNode.replaceChild(link, vodHidden);
    } else {
      // No VOD for this game
      vodHidden.textContent = '—';
      vodHidden.classList.add('spoiless-revealed');
      vodHidden.classList.add('spoiless-vod-none');
    }
    return;
  }
}, true);

} // end initSpoiless
