const state = {
  tournamentName: 'Club Championship',
  groups: []
};

const playersInput = document.getElementById('playersInput');
const tournamentNameInput = document.getElementById('tournamentName');
const validationMsg = document.getElementById('validationMsg');
const groupsSection = document.getElementById('groupsSection');
const groupsContainer = document.getElementById('groupsContainer');
const knockoutSection = document.getElementById('knockoutSection');
const level1Bracket = document.getElementById('level1Bracket');
const level2Bracket = document.getElementById('level2Bracket');

document.getElementById('generateBtn').addEventListener('click', generateGroups);
document.getElementById('buildKnockoutBtn').addEventListener('click', buildKnockouts);

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateRoundRobinMatches(players) {
  return [
    [players[0], players[1]],
    [players[0], players[2]],
    [players[1], players[2]]
  ].map(([a, b]) => ({ a, b, winner: '' }));
}

function generateGroups() {
  const names = playersInput.value
    .split('\n')
    .map((name) => name.trim())
    .filter(Boolean);

  const unique = [...new Set(names)];
  if (unique.length !== names.length) {
    validationMsg.textContent = 'Player names must be unique.';
    return;
  }

  if (names.length < 3) {
    validationMsg.textContent = 'Add at least 3 players.';
    return;
  }

  validationMsg.textContent = '';
  state.tournamentName = tournamentNameInput.value.trim() || 'Club Championship';

  const randomized = shuffle(names);
  const groups = [];
  for (let i = 0; i < randomized.length; i += 3) {
    groups.push(randomized.slice(i, i + 3));
  }

  const remainder = groups[groups.length - 1].length;
  if (remainder < 3 && groups.length > 1) {
    const last = groups.pop();
    last.forEach((player, idx) => groups[idx].push(player));
  }

  state.groups = groups.map((players, index) => ({
    name: `Group ${String.fromCharCode(65 + index)}`,
    players,
    matches: players.length === 3 ? generateRoundRobinMatches(players) : []
  }));

  renderGroups();
  groupsSection.classList.remove('hidden');
  knockoutSection.classList.add('hidden');
}

function calculateRanking(group) {
  const rows = group.players.map((player) => ({ player, wins: 0, played: 0 }));
  const stats = Object.fromEntries(rows.map((r) => [r.player, r]));

  group.matches.forEach((m) => {
    if (!m.winner) return;
    stats[m.a].played += 1;
    stats[m.b].played += 1;
    stats[m.winner].wins += 1;
  });

  return rows.sort((r1, r2) => {
    if (r2.wins !== r1.wins) return r2.wins - r1.wins;
    return r1.player.localeCompare(r2.player);
  });
}

function renderGroups() {
  groupsContainer.innerHTML = '';

  state.groups.forEach((group, groupIndex) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'group';

    const title = document.createElement('h3');
    title.textContent = `${group.name} (${group.players.length} players)`;
    wrapper.appendChild(title);

    if (group.players.length !== 3) {
      const note = document.createElement('p');
      note.textContent = 'This group has a non-standard size. No round-robin matches generated.';
      wrapper.appendChild(note);
      groupsContainer.appendChild(wrapper);
      return;
    }

    const matchesTitle = document.createElement('p');
    matchesTitle.textContent = 'Select winner for each match:';
    wrapper.appendChild(matchesTitle);

    group.matches.forEach((match, matchIndex) => {
      const row = document.createElement('div');
      row.className = 'match-row';

      const label = document.createElement('span');
      label.textContent = `${match.a} vs ${match.b}`;

      const select = document.createElement('select');
      ['', match.a, match.b].forEach((optionValue) => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue || '-- winner --';
        if (optionValue === match.winner) option.selected = true;
        select.appendChild(option);
      });

      select.addEventListener('change', (event) => {
        state.groups[groupIndex].matches[matchIndex].winner = event.target.value;
        renderGroups();
      });

      row.append(label, select);
      wrapper.appendChild(row);
    });

    const ranking = calculateRanking(group);
    const table = document.createElement('table');
    table.className = 'group-table';
    table.innerHTML = `
      <thead>
        <tr><th>Rank</th><th>Player</th><th>Wins</th><th>Played</th></tr>
      </thead>
      <tbody>
        ${ranking
          .map(
            (r, i) =>
              `<tr><td>${i + 1}</td><td>${r.player}</td><td>${r.wins}</td><td>${r.played}</td></tr>`
          )
          .join('')}
      </tbody>
    `;

    wrapper.appendChild(table);
    groupsContainer.appendChild(wrapper);
  });
}

function pairForKnockout(players) {
  const list = [...players];
  const fixtures = [];

  while (list.length > 1) {
    fixtures.push([list.shift(), list.pop()]);
  }

  if (list.length === 1) {
    fixtures.push([list[0], 'BYE']);
  }

  return fixtures;
}

function buildKnockouts() {
  const level1 = [];
  const level2 = [];

  state.groups.forEach((group) => {
    const ranking = calculateRanking(group);

    if (ranking.length >= 2) {
      level1.push(ranking[0].player, ranking[1].player);
    }

    if (ranking.length > 2) {
      ranking.slice(2).forEach((r) => level2.push(r.player));
    }
  });

  renderBracket(level1Bracket, `${state.tournamentName} - Level 1`, pairForKnockout(level1));
  renderBracket(level2Bracket, `${state.tournamentName} - Level 2`, pairForKnockout(level2));
  knockoutSection.classList.remove('hidden');
}

function renderBracket(container, title, fixtures) {
  container.innerHTML = '';

  const h4 = document.createElement('h4');
  h4.textContent = title;
  container.appendChild(h4);

  if (!fixtures.length) {
    const empty = document.createElement('p');
    empty.textContent = 'Not enough players to create this bracket.';
    container.appendChild(empty);
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'bracket-list';

  fixtures.forEach(([home, away], idx) => {
    const li = document.createElement('li');
    li.textContent = `Match ${idx + 1}: ${home} vs ${away}`;
    ul.appendChild(li);
  });

  container.appendChild(ul);
}
