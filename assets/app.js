(() => {
  'use strict';

  const GENIUSES = ['Wonder', 'Invention', 'Discernment', 'Galvanizing', 'Enablement', 'Tenacity'];
  const TABS = ['overview', 'wiring', 'fields', 'dynamics', 'people', 'rhythms'];

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const list = a => a.join(', ');

  let D;          // assessments
  let C;          // authored content
  let people;     // merged people, in file order
  let byId;

  /* ---------- data ---------- */
  async function load() {
    const [a, c] = await Promise.all([
      fetch('data/assessments.json').then(r => r.json()),
      fetch('data/content.json').then(r => r.json())
    ]);
    D = a; C = c;
    people = D.people.map(p => {
      const id = C.idByName[p.name];
      return { ...p, id, first: p.name.split(' ')[0], accent: C.accents[id], gifts_: parseGifts(p.gifts), pending: /^NOT YET/i.test(p.fieldHistory) };
    });
    byId = Object.fromEntries(people.map(p => [p.id, p]));
  }

  const normGift = g => ({ Evangelist: 'Evangelism' }[g] || g);
  function parseGifts(arr) {
    const have = [], maybe = [];
    arr.forEach(g => {
      const m = g.match(/^(.*?)\s*\(possibly\s+(.*)\)$/i);
      if (m) { have.push(normGift(m[1])); maybe.push(normGift(m[2])); } else have.push(normGift(g));
    });
    return { have, maybe };
  }

  const roleOf = (p, g) => p.genius.includes(g) ? 'genius' : p.competency.includes(g) ? 'comp' : p.frustration.includes(g) ? 'frust' : '';
  const countRole = (group, g, role) => group.filter(p => roleOf(p, g) === role).length;
  const founding = () => people.filter(p => C.founding.includes(p.id));
  const mbtiHas = (group, letterIdx, ch) => group.filter(p => p.mbti[letterIdx] === ch).length;
  const giftHolders = g => people.filter(p => p.gifts_.have.includes(g));

  /* ---------- small pieces ---------- */
  const accentStyle = p => `style="--accent:${p.accent}"`;
  const nameLink = p => `<a class="link" href="#people/${p.id}">${esc(p.first)}</a>`;

  function sectionLabel(text, aside) {
    return `<div class="label"><span>${esc(text)}</span>${aside ? `<small>${esc(aside)}</small>` : ''}</div>`;
  }

  function coverageMatrix() {
    const heads = GENIUSES.map(g => `<th>${g}</th>`).join('');
    const phases = `<tr class="phase-row"><th></th><th colspan="2">Ideation</th><th colspan="2">Activation</th><th colspan="2">Implementation</th></tr>`;
    const rows = people.map(p => {
      const cells = GENIUSES.map(g => {
        const r = roleOf(p, g);
        const label = { genius: 'Genius', comp: 'comp', frust: 'Frust' }[r];
        return `<td><div class="cell ${r}">${label}</div></td>`;
      }).join('');
      return `<tr><td class="rowh">${esc(p.first)}<small>${esc(p.genius.join(' + '))}</small></td>${cells}</tr>`;
    }).join('');
    const sums = GENIUSES.map(g => {
      const n = countRole(people, g, 'genius');
      const f = countRole(people, g, 'frust');
      const meta = C.genius[g];
      return `<td><span class="n ${n === 0 ? 'zero' : ''}">${n}</span><small class="${meta.tone}">${esc(meta.tag)}</small><small>${f} frustrated</small></td>`;
    }).join('');
    return `<div class="scroll"><table class="matrix">
      <thead>${phases}<tr><th class="rowh"></th>${heads}</tr></thead>
      <tbody>${rows}<tr class="sumrow"><td class="rowh"><small>Geniuses on team</small></td>${sums}</tr></tbody>
    </table></div>`;
  }

  /* ---------- OVERVIEW ---------- */
  function renderOverview() {
    const o = C.overview, f = founding();
    const before = g => countRole(f, g, 'genius'), after = g => countRole(people, g, 'genius');
    const giftBefore = g => f.filter(p => p.gifts_.have.includes(g)).length;
    const giftAfter = g => giftHolders(g).length;
    const rows = [
      ['Tenacity geniuses', before('Tenacity'), after('Tenacity'), 'Sarah — and she is serving six starters.'],
      ['Discernment geniuses (the filter)', before('Discernment'), after('Discernment'), 'Leelee, Sarah, Travis. “Not yet” is no longer one person’s job.'],
      ['Enablement geniuses (servants)', before('Enablement'), after('Enablement'), 'Rebecca shares the load with Riley.'],
      ['Thinkers (T in Myers–Briggs)', mbtiHas(f, 2, 'T'), mbtiHas(people, 2, 'T'), 'Sarah and Travis can ask the hard question without it costing them.'],
      ['Administration gift', giftBefore('Administration'), giftAfter('Administration'), 'Sarah. The back office finally has an owner.'],
      ['Giving gift', giftBefore('Giving'), giftAfter('Giving'), 'Rebecca. (Her gifts list reads “Giving, possibly Faith.”)'],
      ['Apostolic gift', giftBefore('Apostolic'), giftAfter('Apostolic'), 'Travis. New ground has a pioneer.'],
      ['Perceivers (P in Myers–Briggs)', mbtiHas(f, 3, 'P'), mbtiHas(people, 3, 'P'), 'Still none. Seven of seven close options early.']
    ].map(([label, b, a, note]) => `<tr><td>${esc(label)}</td><td>${b}</td><td class="arrow">→</td><td class="after ${a > b ? 'up' : 'flat'}">${a}</td><td class="note">${esc(note)}</td></tr>`).join('');

    const arrivals = o.arrivals.map(a => {
      const p = byId[a.id];
      return `<article class="card arrival" ${accentStyle(p)}>
        <h3>${esc(p.name)}</h3><div class="role">${esc(a.role)}</div>
        <span class="pill light">${esc(p.mbti)}</span>
        <p style="margin-top:8px">${esc(a.body)}</p></article>`;
    }).join('');

    const n = people.length;
    const exh = giftHolders('Exhortation').length, evg = giftHolders('Evangelism').length;
    const jud = mbtiHas(people, 3, 'J'), fe = mbtiHas(people, 2, 'F'), th = mbtiHas(people, 2, 'T');
    const qt = people.filter(p => /quality time/i.test(p.loveLanguage)).length;
    const dna = [
      [`${exh} / ${n}`, 'Exhortation.', 'The team’s superpower: most of you are gifted to encourage.'],
      [`${evg} / ${n}`, 'Evangelism.', 'Evangelist or Evangelism sits on most profiles. Field 2 is the home field.'],
      [`${jud} / ${n}`, 'Judging.', `${fe} Feelers, ${th} Thinkers. Fast, values-driven decisions — and early closure.`],
      [`${qt} / ${n}`, 'Quality Time.', 'The language most of you receive in. A scheduled hour counts for more than a message.']
    ].map(([big, h, b]) => `<div class="stat"><div class="big">${big}</div><p><strong>${h}</strong> ${esc(b)}</p></div>`).join('');

    const watch = o.watch.map(w => `<li><a class="tab-link" href="#${w.tab}">${esc(w.title)}</a></li>`).join('');
    const roster = people.map(p => `<a href="#people/${p.id}" ${accentStyle(p)}><b>${esc(p.first)}</b><span>${esc(p.mbti)} · ${esc(p.genius.join(' + '))}</span></a>`).join('');

    return `
      <div class="lede-block"><span class="kicker">${esc(o.kicker)}</span><h2>${esc(o.headline)}</h2><p>${esc(o.lede)}</p></div>
      <div>${sectionLabel('Who closed which gap', 'strength → risk → what to actually do')}<div class="grid g3">${arrivals}</div></div>
      <div>${sectionLabel('What changed from four to seven', 'computed from the assessments')}
        <div class="scroll"><table class="change"><thead><tr><th>Measure</th><th>Four</th><th></th><th>Seven</th><th>What it means</th></tr></thead><tbody>${rows}</tbody></table></div></div>
      <div>${sectionLabel('Shared DNA — what all seven of you have in common')}<div class="grid g4">${dna}</div></div>
      <div>${sectionLabel('Watch list', 'the honest part')}
        <div class="block risk"><h3>Three new risks arrived with the new strengths.</h3><ul style="margin:6px 0 0;padding-left:1.2em;font-size:.9rem">${watch}</ul></div></div>
      <div>${sectionLabel('The team')}<div class="roster">${roster}</div></div>`;
  }

  /* ---------- WIRING ---------- */
  function renderWiring() {
    const wireCards = people.map(p => `<article class="card" ${accentStyle(p)}>
        <h3>${esc(p.name)}</h3><span class="pill">${esc(p.mbti)}</span>
        <span class="small-label" style="margin-top:8px">Working Genius</span>
        <p><strong>${esc(p.genius.join(' · '))}</strong></p>
        <p>Comp: ${esc(list(p.competency))}</p><p class="frust" style="color:var(--risk-ink)">Frust: ${esc(list(p.frustration))}</p>
        <span class="small-label" style="margin-top:8px">Spiritual gifts</span><p>${esc(list(p.gifts))}</p>
        <span class="small-label" style="margin-top:8px">Aptitude</span>
        <p>${esc(list(p.aptitude))}${p.aptitudeSecondary ? ` <span style="color:var(--muted)">(also ${esc(list(p.aptitudeSecondary))})</span>` : ''}${p.aptitudeWeakness ? ` <span style="color:var(--risk-ink)">(weak: ${esc(p.aptitudeWeakness.toLowerCase())})</span>` : ''}${p.aptitudeLowest ? ` <span style="color:var(--risk-ink)">(lowest: ${esc(p.aptitudeLowest.toLowerCase())})</span>` : ''}${p.aptitudeGrowthArea ? ` <span style="color:var(--risk-ink)">(growth area: ${esc(p.aptitudeGrowthArea.toLowerCase())})</span>` : ''}</p>
        <span class="small-label" style="margin-top:8px">Love language</span><p>${esc(p.loveLanguage)}</p>
      </article>`).join('');

    // gifts
    const all = {};
    people.forEach(p => { p.gifts_.have.forEach(g => (all[g] ??= { have: [], maybe: [] }).have.push(p.id)); p.gifts_.maybe.forEach(g => (all[g] ??= { have: [], maybe: [] }).maybe.push(p.id)); });
    const gifts = Object.entries(all).sort((a, b) => b[1].have.length - a[1].have.length || a[0].localeCompare(b[0]));
    const gHead = people.map(p => `<th style="color:${p.accent}">${esc(p.first)}</th>`).join('');
    const gRows = gifts.map(([g, v]) => {
      const cells = people.map(p => v.have.includes(p.id) ? `<td><span class="dot" style="--accent:${p.accent}"></span></td>` : v.maybe.includes(p.id) ? `<td><span class="dot maybe" style="--accent:${p.accent}" title="possibly"></span></td>` : '<td></td>').join('');
      const only = v.have.length === 1 ? `<span class="only">only ${esc(byId[v.have[0]].first)}</span>` : `<span class="cnt">${v.have.length}${v.maybe.length ? ` (+${v.maybe.length} possible)` : ''}</span>`;
      return `<tr><td class="rowh">${esc(g)}</td>${cells}<td>${only}</td></tr>`;
    }).join('');

    // MBTI
    const dich = [['Extravert', 'Introvert', 0, 'E', 'I'], ['Sensing', 'Intuitive', 1, 'S', 'N'], ['Thinking', 'Feeling', 2, 'T', 'F'], ['Judging', 'Perceiving', 3, 'J', 'P']].map(([a, b, i, x, y]) => {
      const nx = mbtiHas(people, i, x), ny = mbtiHas(people, i, y);
      return `<div class="row"><span>${a}</span><div class="bar"><i class="${nx ? '' : 'zero'}" style="flex:${nx}">${nx}</i><i class="${ny ? '' : 'zero'}" style="flex:${ny}">${ny}</i></div><span>${b}</span></div>`;
    }).join('');
    const types = people.map(p => `<span class="tag" style="border-left:4px solid ${p.accent}">${esc(p.first)} · ${esc(p.mbti)}</span>`).join('');

    return `
      <div>${sectionLabel('How we’re wired', 'Working Genius · Spiritual Gifts · Aptitude · Myers–Briggs · Love Language')}<div class="grid g4">${wireCards}</div></div>
      <div>${sectionLabel('Working Genius coverage', 'Dark = Genius / Grey = Competency / Red = Frustration')}${coverageMatrix()}
        <div class="grid g3" style="margin-top:14px">${GENIUSES.map(g => `<div class="block ${C.genius[g].tone === 'ok' ? 'good' : 'warn'}"><h4>${g}</h4><p>${esc(C.genius[g].note)}</p></div>`).join('')}</div></div>
      <div>${sectionLabel('Spiritual gifts', 'who holds what — and who holds it alone')}<div class="scroll"><table class="gifts"><thead><tr><th class="rowh">Gift</th>${gHead}<th>On the team</th></tr></thead><tbody>${gRows}</tbody></table></div>
        <p style="font-size:.78rem;color:var(--muted);margin-top:8px">Evangelist and Evangelism are counted together. A dashed circle marks a gift that was listed as “possibly.”</p></div>
      <div>${sectionLabel('Myers–Briggs', 'the temperament of the room')}<div class="grid g2"><div class="dich">${dich}</div><div class="tags" style="align-content:flex-start">${types}</div></div></div>`;
  }

  /* ---------- FOUR FIELDS ---------- */
  function renderFields() {
    const cards = C.fields.map(f => `<article class="card field-card" style="--fc:${f.color}">
        <div class="part">Part ${f.n} · ${esc(f.name)}</div><h3>${esc(f.label)}</h3>
        <div class="owner"><span class="pill">Owner: ${esc(f.owner)}</span><p class="support">${esc(f.support)}</p></div>
        <span class="small-label">NPL tools</span><ul class="tools">${f.tools.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        <p class="why"><b>Why →</b> ${esc(f.why)}</p><p class="watch"><b>Watch →</b> ${esc(f.watch)}</p></article>`).join('');

    const head = C.fields.map(f => `<th>${f.n} ${esc(f.name.split(' ')[0])}</th>`).join('');
    const rows = people.map(p => {
      const m = C.matrix[p.id];
      const cells = m.cells.map(([state, note]) => `<td><div class="cell ${state}">${{ own: 'Own it', support: 'Support', deploy: 'Deploy', costly: 'Costly' }[state]}${note ? `<small>${esc(note)}</small>` : ''}</div></td>`).join('');
      return `<tr><td class="rowh"><a class="link" href="#people/${p.id}" style="text-decoration:none">${esc(p.first)}</a><small>${esc(p.mbti)} · ${esc(p.genius.join('+'))}</small></td>${cells}<td class="contrib">${md(m.oneLine)}</td></tr>`;
    }).join('');
    const legend = C.matrixLegend.map(([k, l]) => `<span><span class="cell ${k}" style="display:inline-block;padding:1px 7px;margin-right:4px">&nbsp;</span>${esc(l)}</span>`).join(' &nbsp; ');

    const fluency = people.map(p => `<article class="card" ${accentStyle(p)}><h3>${esc(p.first)}</h3>
        <div class="tags" style="margin-top:8px">${C.tools[p.id].map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div></article>`).join('');

    const training = C.training.map(t => { const p = byId[t.id]; return `<article class="card training" ${accentStyle(p)}><h3>${esc(p.first)}</h3><div class="role">${esc(t.role)}</div><p>${esc(t.body)}</p></article>`; }).join('');

    return `
      <div class="lede-block"><span class="kicker">Mark 4:1–20, 26–29 · Acts 14:20–23</span><h2>Four Fields — who owns what</h2>
        <p>Deploying seven people across Jesus’ strategy. Ownership is a starting deployment, not a ceiling on anyone’s calling — revisit after one 90-day cycle.</p></div>
      <div class="grid g5">${cards}</div>
      <div>${sectionLabel('Who owns what', '')}<p class="legend" style="margin:-6px 0 12px">${legend}</p>
        <div class="scroll"><table class="matrix"><thead><tr><th class="rowh"></th>${head}<th class="rowh" style="padding-left:10px">Sharpest contribution</th></tr></thead><tbody>${rows}</tbody></table></div></div>
      <div>${sectionLabel('NPL tools each person should be fluent in', 'tool names as listed on the NPL toolbox')}<div class="grid g4">${fluency}</div></div>
      <div>${sectionLabel('Training your church — who does what')}<div class="grid g4">${training}</div></div>
      <div class="dark"><span class="small-label">The one rhythm that fixes most of this</span><ol>${C.rhythms.one.items.map(i => `<li>${md(i)}</li>`).join('')}</ol></div>`;
  }

  /* ---------- DYNAMICS ---------- */
  function renderDynamics() {
    const d = C.dynamics;
    const solved = d.solved.map(s => `<div class="block good"><h3>${esc(s.title)}</h3><p>${esc(s.body)}</p></div>`).join('');
    const risks = d.risks.map(r => `<div class="block risk"><h3><span class="num">${r.n}.</span> ${esc(r.title)}</h3><p>${esc(r.body)}</p><p class="do"><b>Do —</b> ${esc(r.do)}</p></div>`).join('');
    const pairings = d.pairings.map(p => `<div class="block good pairing"><h4>${esc(p.pair)}</h4><p>${esc(p.body)}</p></div>`).join('');
    const spof = d.spof.map(s => `<tr><td>${esc(s.who)}</td><td>${esc(s.carries)}</td><td>${esc(s.fix)}</td></tr>`).join('');
    const dr = d.decisionRights;
    const drRows = dr.rows.map(r => `<tr><td><strong>${esc(r[0])}</strong></td><td>${esc(r[1])}</td><td class="blank"></td></tr>`).join('');
    return `
      <div class="lede-block"><span class="kicker">strength → risk → what to actually do</span><h2>Honest insights, including the gaps.</h2>
        <p>The expansion solved real problems and created new ones. Both are real; neither is a verdict.</p></div>
      <div>${sectionLabel('What the expansion solved')}<div class="grid g2">${solved}</div></div>
      <div>${sectionLabel('Live risks to carry', 'strength → risk → what to actually do')}<div class="grid g2">${risks}</div></div>
      <div>${sectionLabel('Complementary pairings worth naming')}<div class="grid g2">${pairings}</div></div>
      <div>${sectionLabel('Single points of failure')}<div class="scroll"><table class="spof"><thead><tr><th>Who</th><th>What routes through them</th><th>Spread the weight</th></tr></thead><tbody>${spof}</tbody></table></div></div>
      <div>${sectionLabel('Decision rights — one page, this month', 'JT and Travis')}<p style="font-size:.9rem;max-width:70ch">${esc(dr.intro)}</p>
        <div class="scroll"><table class="spof decision"><thead><tr><th>Decision</th><th>Starting suggestion</th><th>Agreed owner</th></tr></thead><tbody>${drRows}</tbody></table></div></div>`;
  }

  /* ---------- PEOPLE ---------- */
  function renderPerson(p) {
    const c = C.people[p.id];
    const others = people.filter(o => o.id !== p.id);
    const gifts = p.gifts.map(esc).join(', ');
    const aptitude = esc(list(p.aptitude)) + (p.aptitudeSecondary ? ` <span style="color:var(--muted)">(also ${esc(list(p.aptitudeSecondary))})</span>` : '') +
      (p.aptitudeWeakness ? ` <span style="color:var(--risk-ink)">(named weakness: ${esc(p.aptitudeWeakness.toLowerCase())})</span>` : '') +
      (p.aptitudeLowest ? ` <span style="color:var(--risk-ink)">(lowest: ${esc(p.aptitudeLowest.toLowerCase())})</span>` : '') +
      (p.aptitudeGrowthArea ? ` <span style="color:var(--risk-ink)">(growth area: ${esc(p.aptitudeGrowthArea.toLowerCase())})</span>` : '');
    const history = p.pending ? `<span class="pending">Not yet supplied</span>` : esc(p.fieldHistory);
    const tb = c => `<div class="block ${c.cls}"><h3>${esc(c.t)}</h3><p>${esc(c.b)}</p></div>`;
    const pairs = [];
    const th = c.thrive.map(x => tb({ ...x, cls: 'good' })), st = c.struggle.map(x => tb({ ...x, cls: 'risk' }));
    th.forEach((t, i) => pairs.push(t, st[i] || ''));
    return `<div class="profile" id="profile-${p.id}" ${accentStyle(p)} hidden>
      <div class="p-head"><div><h2>${esc(p.name)}</h2><p class="tag-line">${esc(c.tagline)}</p></div>
        <div class="meta">${esc(p.mbti)} · ${esc(p.genius.join(' + '))}<br>${p.pending ? 'Field history pending' : esc(p.fieldHistory.split(';')[0])}</div></div>
      <div>${sectionLabel('Your wiring')}<div class="wire-cards">
        <div class="card"><span class="small-label">Working Genius</span><p><strong>${esc(p.genius.join(' · '))}</strong></p><p>Comp: ${esc(list(p.competency))}</p><p class="frust">Frust: ${esc(list(p.frustration))}</p></div>
        <div class="card"><span class="small-label">Spiritual gifts</span><p>${gifts}</p></div>
        <div class="card"><span class="small-label">Aptitude</span><p>${aptitude}</p></div>
        <div class="card"><span class="small-label">Field history</span><p>${history}</p></div>
        <div class="card"><span class="small-label">Love language</span><p>${esc(p.loveLanguage)}</p></div></div></div>
      <div>${sectionLabel('What you own in the Four Fields')}<div class="dark"><h3>${esc(c.ownsHead)}</h3><p>${esc(c.ownsBody)}</p>
        <div class="tools-line">Be fluent in these NPL tools — <b>${C.tools[p.id].map(esc).join(' · ')}</b></div></div></div>
      <div>${sectionLabel('Where you’ll thrive — and where you’ll struggle', 'both are real; neither is a verdict')}<div class="grid g2">${pairs.join('')}</div></div>
      <div>${sectionLabel('Pitfalls to watch for', 'the specific failure modes of your wiring')}<div class="pitfalls"><ul>${c.pitfalls.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>
      <div>${sectionLabel('Working with the other six')}<div class="grid g3 with-grid">${others.map(o => `<div class="card"><h4>With ${esc(o.first)}</h4><p>${esc(c.with[o.id])}</p></div>`).join('')}</div></div>
      <div>${sectionLabel('Next 90 days', 'concrete, checkable, yours')}<div class="bottom">
        <div class="dark"><span class="small-label">Concrete, checkable, yours</span><ol>${c.ninety.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>
        <div><div class="encourage-box"><span class="small-label">How the team should encourage you</span>${esc(c.encourage)}</div>
          <div class="guardrail" style="margin-top:12px"><span class="small-label">Guardrail</span><q>${esc(c.guardrail)}</q></div></div></div></div>
    </div>`;
  }

  function renderPeople() {
    const chips = people.map(p => `<button class="chip" ${accentStyle(p)} data-person="${p.id}" aria-pressed="false">${esc(p.first)}</button>`).join('');
    return `<div class="subnav" role="group" aria-label="Choose a person">${chips}</div>${people.map(renderPerson).join('')}`;
  }

  /* ---------- RHYTHMS ---------- */
  function renderRhythms() {
    const r = C.rhythms;
    const cadence = r.cadence.map(c => `<div class="card plain cadence"><h3>${esc(c.when)}</h3><ul>${c.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('');
    const loop = r.loop.steps.map(([h, b]) => `<div class="card plain loop"><div class="step"><b>${esc(h)}</b><p>${esc(b)}</p></div></div>`).join('');
    const meetings = r.meetings.map(m => `<div class="block soft"><h4>${esc(m.title)}</h4><p>${esc(m.body)}</p></div>`).join('');
    const enc = people.map(p => { const e = r.encourage.cards[p.id]; return `<article class="card enc" ${accentStyle(p)}><h3>${esc(p.first)} → ${esc(e.lang)}</h3><p style="margin-top:6px">${esc(e.tip)}</p></article>`; }).join('');
    const ll = people.map(p => `<tr><td><strong>${esc(p.first)}</strong></td><td>${esc(p.loveLanguage)}</td></tr>`).join('');
    return `
      <div class="lede-block"><span class="kicker">the room is easy to fill; the follow-through is the job</span><h2>The rhythm that carries the wiring.</h2>
        <p>Rhythm is where the missing Tenacity gets supplied — by the calendar, not by willpower.</p></div>
      <div class="dark"><span class="small-label">${esc(r.one.label)}</span><ol>${r.one.items.map(i => `<li>${md(i)}</li>`).join('')}</ol></div>
      <div>${sectionLabel('Operating cadence')}<div class="grid g3">${cadence}</div></div>
      <div>${sectionLabel(r.loop.label, 'MAWL = Model, Assist, Watch, Leave')}<div class="grid g4">${loop}</div></div>
      <div>${sectionLabel('How to run the room', 'built for this team’s wiring')}<div class="grid g3">${meetings}</div></div>
      <div>${sectionLabel(r.encourage.label, r.encourage.tagline)}<div class="grid g4">${enc}</div>
        <details style="margin-top:14px;font-size:.84rem"><summary style="cursor:pointer;color:var(--muted)">Love-language answers as submitted</summary><div class="scroll"><table class="spof"><tbody>${ll}</tbody></table></div></details></div>`;
  }

  /* ---------- footer ---------- */
  function renderFoot() {
    $('#foot').innerHTML = `<b>Framework:</b> ${esc(C.meta.framework)} — Entry, Gospel, Discipleship, Church, Leadership Development. Tool names as listed on the NPL toolbox. MAWL = Model, Assist, Watch, Leave. DBS = Discovery Bible Study.<br>
      <b>Inputs:</b> ${esc(C.meta.inputs)}. Working Genius letters are read as ranked order (first two = Genius, middle two = Competency, last two = Frustration) — confirm against each official report before treating the Competency/Frustration split as final. Aptitude results were self-reported in differing formats. Ownership calls are a starting deployment and a conversation opener, not a ceiling on anyone’s calling.`;
  }

  /* ---------- routing ---------- */
  let currentPerson = null;
  function show(tab, person) {
    if (!TABS.includes(tab)) tab = 'overview';
    TABS.forEach(t => {
      const sel = t === tab;
      $('#panel-' + t).hidden = !sel;
      const b = $('#tab-' + t); b.setAttribute('aria-selected', sel); b.tabIndex = sel ? 0 : -1;
      if (sel && b.scrollIntoView) b.scrollIntoView({ block: 'nearest', inline: 'center' });
    });
    if (tab === 'people') {
      if (!byId[person]) person = currentPerson || people[0].id;
      currentPerson = person;
      $$('.profile').forEach(el => el.hidden = el.id !== 'profile-' + person);
      $$('.chip').forEach(el => el.setAttribute('aria-pressed', el.dataset.person === person));
    }
    document.title = (tab === 'people' && person ? byId[person].name + ' — ' : '') + C.meta.title;
  }
  function route() {
    const [tab, person] = location.hash.replace(/^#/, '').split('/');
    show(tab || 'overview', person);
  }

  function wire() {
    $$('.tablist button').forEach(b => b.addEventListener('click', () => { location.hash = b.dataset.tab === 'people' && currentPerson ? `people/${currentPerson}` : b.dataset.tab; window.scrollTo({ top: 0 }); }));
    $('.tablist').addEventListener('keydown', e => {
      const i = TABS.indexOf(document.activeElement.dataset.tab);
      if (i < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const n = e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length;
      $('#tab-' + TABS[n]).focus(); location.hash = TABS[n];
    });
    $$('.chip').forEach(c => c.addEventListener('click', () => { location.hash = 'people/' + c.dataset.person; }));
    window.addEventListener('hashchange', () => { route(); window.scrollTo({ top: 0 }); });
  }

  /* ---------- boot ---------- */
  load().then(() => {
    $('#month').textContent = C.meta.month;
    $('#count').textContent = `${people.length} assessments`;
    $('#panel-overview').innerHTML = renderOverview();
    $('#panel-wiring').innerHTML = renderWiring();
    $('#panel-fields').innerHTML = renderFields();
    $('#panel-dynamics').innerHTML = renderDynamics();
    $('#panel-people').innerHTML = renderPeople();
    $('#panel-rhythms').innerHTML = renderRhythms();
    renderFoot();
    wire();
    route();
  }).catch(err => {
    console.error(err);
    $('#main').innerHTML = `<p class="notice"><strong>Couldn’t load the team data.</strong> If you opened index.html by double-clicking it, the browser blocks reading the data files. View it from the published site, or run <code>python3 -m http.server</code> in this folder and open http://localhost:8000.</p>`;
  });
})();
