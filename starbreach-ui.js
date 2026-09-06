(() => {
  'use strict';

  const RELEASE = '0.14.0';
  const MANUAL = 'https://www.starbreach.com/_files/ugd/94fdcd_ee37d7394e564a90813e746ef8da0123.pdf';
  const KEYS = {
    layer: 'starbreach-layer-tuning-v1',
    referenceHidden: 'starbreach-faction-reference-hidden',
    addCollapsed: 'starbreach-dock-add-collapsed',
    theme: 'starbreach-theme-v1',
    themeMigration: 'starbreach-theme-default-v0135',
    guide: 'starbreach-breach-guide-v1',
    play: 'starbreach-breach-play-state-v1'
  };

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0));
  const readJson = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value && typeof value === 'object' ? value : fallback;
    } catch {
      return fallback;
    }
  };
  const writeJson = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  };

  const LAYERS = ['outer', 'section', 'inner'];
  const LAYER_DEFAULTS = { selected: 'section', outer: 0, section: 0, inner: 0 };
  const OLD_THEME = { h: 195, s: 58, v: 48, sep: 72 };
  const NEW_THEME = { h: 192, s: 50, v: 43, sep: 82 };
  const LAYER_VARS = {
    outer: ['--sb-panel', '--sb-panel-low', '--sb-breach-panel', '--sb-breach-low'],
    section: ['--sb-unit', '--sb-section', '--sb-breach-section'],
    inner: ['--sb-unit-body', '--sb-deep', '--sb-input', '--sb-breach-deep']
  };

  let tuning = { ...LAYER_DEFAULTS, ...readJson(KEYS.layer, {}) };
  if (!LAYERS.includes(tuning.selected)) tuning.selected = 'section';
  for (const layer of LAYERS) tuning[layer] = clamp(tuning[layer], -18, 18);

  function saveTuning() { writeJson(KEYS.layer, tuning); }

  function currentThemeFromControls() {
    const num = (id, fallback) => Number(qs(`#${id}`)?.value ?? fallback);
    return {
      h: num('themeHue', NEW_THEME.h), s: num('themeSat', NEW_THEME.s),
      v: num('themeVal', NEW_THEME.v), sep: num('themeSep', NEW_THEME.sep),
      open: qs('#themePanel')?.classList.contains('open') || false
    };
  }

  function shiftRgb(value, amount) {
    const nums = String(value).match(/[\d.]+/g);
    if (!nums || nums.length < 3) return value;
    const rgb = nums.slice(0, 3).map(Number);
    const p = clamp(amount, -18, 18) / 100;
    const out = rgb.map(c => Math.round(p >= 0 ? c + (255 - c) * p : c * (1 + p)));
    return `rgb(${out[0]} ${out[1]} ${out[2]})`;
  }

  function resetBasePalette() {
    if (typeof window.applyTheme === 'function') window.applyTheme(currentThemeFromControls(), false);
  }

  function applyLayerTuning(resetBase = false) {
    if (resetBase) resetBasePalette();
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    for (const layer of LAYERS) {
      const amount = tuning[layer];
      if (!amount) continue;
      for (const variable of LAYER_VARS[layer]) {
        const base = cs.getPropertyValue(variable).trim();
        if (base) root.style.setProperty(variable, shiftRgb(base, amount));
      }
    }
    updateLayerUi();
  }

  function updateLayerUi() {
    qsa('[data-theme-layer]').forEach(btn => {
      const active = btn.dataset.themeLayer === tuning.selected;
      btn.classList.toggle('selected', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    const slider = qs('#themeLayerAdjust');
    const out = qs('#themeLayerOut');
    const label = qs('#themeLayerLabel');
    const value = tuning[tuning.selected];
    if (slider) slider.value = String(value);
    if (out) out.textContent = `${value > 0 ? '+' : ''}${value}`;
    if (label) label.textContent = `${tuning.selected[0].toUpperCase()}${tuning.selected.slice(1)} brightness`;
  }

  function setThemeViaControls(theme) {
    for (const [id, value] of Object.entries({ themeHue: theme.h, themeSat: theme.s, themeVal: theme.v, themeSep: theme.sep })) {
      const input = qs(`#${id}`);
      if (!input) continue;
      input.value = String(value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function looksLikeOldDefault(saved) {
    if (!saved || typeof saved !== 'object') return true;
    const dh = Math.abs(Number(saved.h) - OLD_THEME.h);
    const deltaHue = Math.min(dh, 360 - dh);
    return deltaHue <= 10 && Math.abs(Number(saved.s) - OLD_THEME.s) <= 10 &&
      Math.abs(Number(saved.v) - OLD_THEME.v) <= 8 && Math.abs(Number(saved.sep) - OLD_THEME.sep) <= 15;
  }

  function installThemeDefaultMigration() {
    let migrated = false;
    try { migrated = localStorage.getItem(KEYS.themeMigration) === '1'; } catch {}
    if (!migrated) {
      const saved = readJson(KEYS.theme, null);
      if (looksLikeOldDefault(saved)) {
        tuning = { ...LAYER_DEFAULTS };
        saveTuning();
        setThemeViaControls(NEW_THEME);
      } else applyLayerTuning(true);
      try { localStorage.setItem(KEYS.themeMigration, '1'); } catch {}
    }
    qs('#resetTheme')?.addEventListener('click', () => queueMicrotask(() => {
      tuning = { ...LAYER_DEFAULTS };
      saveTuning();
      setThemeViaControls(NEW_THEME);
      applyLayerTuning(true);
    }));
  }

  function installThemeLayerControls() {
    const preview = qs('.theme-preview');
    const sliders = qs('.theme-sliders');
    if (!preview || !sliders) return;
    preview.removeAttribute('aria-hidden');
    preview.setAttribute('role', 'group');
    preview.setAttribute('aria-label', 'Choose a layer to fine tune');
    qsa('.theme-swatch', preview).forEach(old => {
      if (old.matches('button[data-theme-layer]')) return;
      const layer = LAYERS.find(name => old.classList.contains(name));
      if (!layer) return;
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = old.className; btn.textContent = old.textContent;
      btn.dataset.themeLayer = layer; btn.setAttribute('aria-pressed', 'false');
      old.replaceWith(btn);
    });
    if (!qs('#themeLayerAdjust')) {
      const help = document.createElement('div');
      help.className = 'theme-layer-help';
      help.textContent = 'Tap Outer / Section / Inner, then use the layer slider for a local brightness nudge. The four sliders below still change the whole scheme.';
      preview.insertAdjacentElement('afterend', help);
      const row = document.createElement('div');
      row.className = 'theme-slider theme-layer-slider';
      row.innerHTML = '<label id="themeLayerLabel" for="themeLayerAdjust">Section brightness</label><input id="themeLayerAdjust" type="range" min="-18" max="18" step="1" value="0"><output id="themeLayerOut">0</output>';
      sliders.prepend(row);
    }
    qsa('[data-theme-layer]').forEach(btn => btn.addEventListener('click', () => {
      tuning.selected = btn.dataset.themeLayer; saveTuning(); updateLayerUi();
    }));
    qs('#themeLayerAdjust')?.addEventListener('input', event => {
      tuning[tuning.selected] = Number(event.target.value); saveTuning(); applyLayerTuning(true);
    });
    for (const id of ['themeHue', 'themeSat', 'themeVal', 'themeSep']) {
      qs(`#${id}`)?.addEventListener('input', () => queueMicrotask(() => applyLayerTuning(true)));
    }
    applyLayerTuning(false);
  }

  function installFactionReferenceToggle() {
    const panel = qs('.reference-panel');
    const title = panel && qs('.factiontitle', panel);
    const pages = qs('#sourcePages');
    if (!panel || !title) return;
    panel.id = panel.id || 'factionReferencePanel';
    let actions = qs('.faction-ref-actions', title);
    if (!actions) {
      actions = document.createElement('div'); actions.className = 'faction-ref-actions';
      if (pages) actions.appendChild(pages); title.appendChild(actions);
    }
    let button = qs('#toggleFactionReference');
    if (!button) {
      button = document.createElement('button'); button.id = 'toggleFactionReference'; button.type = 'button';
      button.className = 'tiny ghost ref-toggle'; actions.appendChild(button);
    }
    let hidden = false;
    try { hidden = localStorage.getItem(KEYS.referenceHidden) === '1'; } catch {}
    const render = () => {
      panel.classList.toggle('ref-collapsed', hidden); button.textContent = hidden ? 'Show' : 'Hide';
      button.setAttribute('aria-expanded', String(!hidden));
    };
    button.addEventListener('click', () => {
      hidden = !hidden;
      try { localStorage.setItem(KEYS.referenceHidden, hidden ? '1' : '0'); } catch {}
      render();
    });
    render();
  }

  function installFactionEmphasis() {
    const select = qs('#faction'); const label = select?.closest('label');
    if (!select || !label) return;
    label.classList.add('faction-field');
    if (qs('.faction-label-text', label)) return;
    for (const node of [...label.childNodes]) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().toLowerCase() === 'faction') node.remove();
    }
    const title = document.createElement('span'); title.className = 'faction-label-text'; title.textContent = 'Faction';
    label.insertBefore(title, select);
  }

  function installRosterAddModel() {
    const panel = qs('.add-panel'); const rosterPanel = qs('.roster-panel');
    const rosterList = rosterPanel && (qs('#roster', rosterPanel) || qs('.roster', rosterPanel));
    if (!panel || !rosterPanel || !rosterList) return;
    panel.id = 'rosterAddModel'; panel.classList.remove('panel', 'pad', 'stack', 'add-panel'); panel.classList.add('roster-add-model');
    const heading = qs('h2', panel); const tabs = qs('.category-tabs', panel); const profile = qs('label', panel);
    const addButton = qs('#addUnit', panel); const help = qs('.add-help', panel);
    const head = document.createElement('div'); head.className = 'roster-add-head';
    const titleWrap = document.createElement('div'); titleWrap.className = 'roster-add-title-wrap';
    const kicker = document.createElement('span'); kicker.className = 'roster-add-kicker'; kicker.textContent = 'WARBAND';
    if (heading) { heading.className = 'roster-add-title'; heading.textContent = 'Add model'; titleWrap.append(kicker, heading); }
    const toggle = document.createElement('button'); toggle.id = 'toggleRosterAddModel'; toggle.type = 'button'; toggle.className = 'tiny ghost roster-add-toggle';
    head.append(titleWrap, toggle);
    const body = document.createElement('div'); body.className = 'roster-add-body'; if (tabs) body.appendChild(tabs);
    const controls = document.createElement('div'); controls.className = 'roster-add-controls';
    if (profile) controls.appendChild(profile); if (addButton) controls.appendChild(addButton); body.appendChild(controls);
    if (help) {
      const details = document.createElement('details'); details.className = 'add-help-details';
      const summary = document.createElement('summary'); summary.textContent = 'Builder rules & automation'; details.append(summary, help); body.appendChild(details);
    }
    panel.replaceChildren(head, body); rosterPanel.insertBefore(panel, rosterList);
    let collapsed = false;
    try { collapsed = localStorage.getItem(KEYS.addCollapsed) === '1'; } catch {}
    const render = () => { panel.classList.toggle('collapsed', collapsed); toggle.textContent = collapsed ? 'Show' : 'Hide'; toggle.setAttribute('aria-expanded', String(!collapsed)); };
    toggle.addEventListener('click', () => {
      collapsed = !collapsed;
      try { localStorage.setItem(KEYS.addCollapsed, collapsed ? '1' : '0'); } catch {}
      render();
    });
    render();
  }

  const legacyGuide = readJson(KEYS.guide, {});
  const hadPlayState = (() => { try { return localStorage.getItem(KEYS.play) !== null; } catch { return false; } })();
  let playState = { turn: 1, models: {}, ...readJson(KEYS.play, {}) };
  let guideState = { open: false, phase: 1, ...legacyGuide };
  if (!hadPlayState && Number(legacyGuide.turn) > 0) playState.turn = Number(legacyGuide.turn);
  playState.turn = Math.max(1, Number(playState.turn) || 1);
  if (!playState.models || typeof playState.models !== 'object') playState.models = {};
  guideState.open = !!guideState.open; guideState.phase = clamp(guideState.phase || 1, 1, 3);

  function savePlayState() { writeJson(KEYS.play, playState); }
  function saveGuideState() { writeJson(KEYS.guide, { open: guideState.open, phase: guideState.phase, turn: playState.turn }); }

  function renderTurnDisplays() {
    qsa('[data-breach-turn-output]').forEach(out => { if ('value' in out) out.value = String(playState.turn); out.textContent = String(playState.turn); });
    const bottomToggle = qs('#breachGuideToggle');
    if (bottomToggle && !guideState.open) bottomToggle.textContent = `Turn ${playState.turn} · Turn guide`;
  }

  function changeTurn(delta) {
    playState.turn = Math.max(1, playState.turn + Number(delta || 0)); savePlayState(); saveGuideState(); renderTurnDisplays();
  }

  function factionScope() { return String(qs('#faction')?.value || qs('#breachMeta')?.textContent.split('•')[0] || 'warband').trim(); }

  function modelKey(card) {
    const id = card.dataset.id || 'model';
    const baseName = qs('.breach-unit-cost .muted.small', card)?.textContent.trim() || qs('.breach-unit-head h2', card)?.textContent.trim() || 'profile';
    return `${factionScope()}|${id}|${baseName}`;
  }

  function maxHealthFromCard(card) {
    const pip = qs('.statpip[data-stat="H"]', card);
    const nums = String(pip?.textContent || '').match(/-?\d+(?:\.\d+)?/g);
    return Math.max(0, Number(nums?.[0] ?? 0));
  }

  function getModelState(card) {
    const key = modelKey(card); const max = maxHealthFromCard(card); let state = playState.models[key];
    if (!state || typeof state !== 'object') {
      state = { health: max, maxHealth: max, status: 'normal', once: {} }; playState.models[key] = state; savePlayState();
    }
    if (!state.once || typeof state.once !== 'object') state.once = {};
    if (!['normal', 'down', 'ambush', 'dead'].includes(state.status)) state.status = 'normal';
    const oldMax = Number(state.maxHealth); const current = Number(state.health);
    if (!Number.isFinite(current)) state.health = max;
    if (Number.isFinite(oldMax) && oldMax !== max) state.health = current === oldMax ? max : Math.min(current, max);
    state.maxHealth = max; state.health = clamp(state.health, 0, max);
    return { key, state, max };
  }

  const ONCE_RE = /(?:once\s*[- ]?per\s*[- ]?game|once\s+during\s+(?:a|the)\s+game|one\s+time\s+per\s+game)/i;
  function tinyHash(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return (hash >>> 0).toString(36);
  }

  function oncePerGameItems(card) {
    const candidates = qsa('.breach-ability,.breach-equip', card);
    qsa('.breach-section', card).forEach(section => {
      if (!section.querySelector('.breach-ability,.breach-equip') && ONCE_RE.test(section.textContent)) candidates.push(section);
    });
    const seen = new Set(); const items = [];
    for (const node of candidates) {
      const text = node.textContent.replace(/\s+/g, ' ').trim(); if (!ONCE_RE.test(text)) continue;
      const label = qs('.ability-head b,.equipname,h3,b', node)?.textContent.trim() || 'Once-per-game ability';
      const key = tinyHash(`${label}|${text}`); if (seen.has(key)) continue; seen.add(key); items.push({ key, label });
    }
    return items;
  }

  function trackerHtml(card) {
    const { state, max } = getModelState(card); const onceItems = oncePerGameItems(card);
    const statuses = [['normal', 'Ready'], ['down', 'Down'], ['ambush', 'Ambush'], ['dead', 'Dead']];
    return `<div class="breach-play-tools-inner"><div class="breach-health-control"><div class="breach-play-label">Current Health</div><div class="breach-health-stepper"><button type="button" data-breach-play="health-down" aria-label="Lose one Health">−</button><output class="breach-health-value" data-health-output>${state.health} / ${max}</output><button type="button" data-breach-play="health-up" aria-label="Restore one Health">+</button></div></div><div class="breach-status-control"><div class="breach-play-label">Status</div><div class="breach-status-buttons">${statuses.map(([value, label]) => `<button type="button" data-breach-play="status" data-status="${value}" class="status-${value}${state.status === value ? ' active' : ''}" aria-pressed="${state.status === value}">${label}</button>`).join('')}</div></div>${onceItems.length ? `<div class="breach-once-control"><div class="breach-play-label">Once-per-game</div><div class="breach-once-list">${onceItems.map(item => `<label class="breach-once-marker"><input type="checkbox" data-breach-once="${item.key}" ${state.once[item.key] ? 'checked' : ''}><span>${item.label}</span></label>`).join('')}</div></div>` : ''}</div>`;
  }

  function syncModelCard(card) {
    const { state, max } = getModelState(card); const output = qs('[data-health-output]', card);
    if (output) output.textContent = `${state.health} / ${max}`;
    qsa('[data-breach-play="status"]', card).forEach(button => {
      const active = button.dataset.status === state.status; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
    });
    qsa('[data-breach-once]', card).forEach(input => { input.checked = !!state.once[input.dataset.breachOnce]; });
    card.dataset.breachStatus = state.status;
    card.classList.toggle('play-down', state.status === 'down'); card.classList.toggle('play-ambush', state.status === 'ambush');
    card.classList.toggle('play-dead', state.status === 'dead'); card.classList.toggle('play-zero-health', state.health <= 0);
  }

  function decorateBreachCards(force = false) {
    qsa('#breachContent .breach-unit[data-id]').forEach(card => {
      let tracker = qs('.breach-play-tools', card);
      if (force && tracker) { tracker.remove(); tracker = null; }
      if (!tracker) {
        const body = qs('.breach-unit-body', card); if (!body) return;
        tracker = document.createElement('section'); tracker.className = 'breach-play-tools'; tracker.setAttribute('aria-label', 'Live model state');
        tracker.innerHTML = trackerHtml(card); body.prepend(tracker);
      }
      syncModelCard(card);
    });
  }

  function resetBattleState() {
    if (!window.confirm('Reset BREACH turn, current Health, statuses, and once-per-game markers for this battle?')) return;
    playState = { turn: 1, models: {} }; guideState.phase = 1; savePlayState(); saveGuideState(); renderTurnDisplays(); decorateBreachCards(true); renderGuide();
  }

  function installBreachGameplay() {
    const breach = qs('#breachView'); const head = breach && qs('.breach-page-head', breach); const content = breach && qs('#breachContent', breach);
    if (!breach || !head || !content) return;
    if (!qs('#breachPlayBar', breach)) {
      const bar = document.createElement('section'); bar.id = 'breachPlayBar'; bar.className = 'breach-playbar';
      bar.innerHTML = `<div class="breach-playbar-copy"><span class="breach-play-kicker">LIVE BATTLE</span><b>Turn tracker</b></div><div class="breach-turn-controls"><button type="button" data-breach-play="turn-down" aria-label="Previous turn">−</button><output data-breach-turn-output aria-label="Current turn">${playState.turn}</output><button type="button" data-breach-play="turn-up" aria-label="Next turn">+</button></div><button type="button" class="breach-reset-state" data-breach-play="reset">Reset battle</button>`;
      head.insertAdjacentElement('afterend', bar);
    }
    breach.addEventListener('click', event => {
      const button = event.target.closest('[data-breach-play]'); if (!button) return;
      const action = button.dataset.breachPlay;
      if (action === 'turn-up') return changeTurn(1); if (action === 'turn-down') return changeTurn(-1); if (action === 'reset') return resetBattleState();
      const card = button.closest('.breach-unit[data-id]'); if (!card) return;
      const { state, max } = getModelState(card);
      if (action === 'health-down') { state.health = Math.max(0, state.health - 1); if (state.health === 0) state.status = 'dead'; }
      else if (action === 'health-up') { const wasZero = state.health === 0; state.health = Math.min(max, state.health + 1); if (wasZero && state.health > 0 && state.status === 'dead') state.status = 'normal'; }
      else if (action === 'status') state.status = button.dataset.status || 'normal';
      savePlayState(); syncModelCard(card);
    });
    breach.addEventListener('change', event => {
      const input = event.target.closest('[data-breach-once]'); if (!input) return;
      const card = input.closest('.breach-unit[data-id]'); if (!card) return;
      const { state } = getModelState(card); state.once[input.dataset.breachOnce] = input.checked; savePlayState(); syncModelCard(card);
    });
    const observer = new MutationObserver(() => queueMicrotask(() => decorateBreachCards(false)));
    observer.observe(content, { childList: true }); decorateBreachCards(false); renderTurnDisplays();
  }

  const PHASES = [{ n: 1, short: 'Orders' }, { n: 2, short: 'Special' }, { n: 3, short: 'End' }];
  const pageHref = page => `${MANUAL}#page=${page}`;
  const pageLink = (page, label = `PDF p.${page}`) => `<a class="breach-guide-page" href="${pageHref(page)}" target="_blank" rel="noopener">${label}</a>`;

  function phaseHtml(phase) {
    if (phase === 1) return `<div class="breach-guide-phase"><div class="breach-guide-phase-head"><h3>1. Order Dice Phase</h3>${pageLink(9)}</div><div class="breach-guide-callout"><b>Loop:</b> draw a die → assign it → resolve that model's order immediately → draw again. Continue until every order die has been drawn.</div><div class="breach-guide-steps"><div class="breach-guide-step">Put the order dice for the models currently on the table into the shared opaque bag and shake it.</div><div class="breach-guide-step">Blindly draw one die. Its color determines which warband receives the activation.</div><div class="breach-guide-step">That player assigns the die to one available model that has not yet taken an order, sets the chosen order face up, and resolves it immediately.</div><div class="breach-guide-step">Remember which player assigned the <b>first order of the turn</b>; that determines who starts the Special Actions Phase.</div><div class="breach-guide-step">Repeat until all dice are drawn. If a model is removed before receiving an order, remove one matching die from the bag.</div></div><div class="breach-guide-phase-head"><h3>Six orders</h3>${pageLink(8, 'PDF p.8')}</div><div class="breach-guide-grid"><div class="breach-guide-card"><b>1 · Down</b>No move or shot. +2 Initiative on dodge rolls against ranged attacks. An unordered model targeted by a ranged attack may immediately pull its die and go Down before attack rolls.</div><div class="breach-guide-card"><b>2 · Mend</b>Roll D6 and regain that much Health, up to the model's starting maximum.</div><div class="breach-guide-card"><b>3 · Cover Fire</b>Choose a point in line-of-sight and weapon range. Every model within 2″ becomes a target. Attacker applies −2 Initiative to the attack rolls.</div><div class="breach-guide-card"><b>4 · Fire</b>Fire one equipped weapon at one enemy in line-of-sight and range, or cast a psychic ability if able. Mechs have their stated exception.</div><div class="breach-guide-card"><b>5 · Advance</b>Move up to M, then optionally Fire. The attack or psychic roll gets −1 Initiative for moving first.</div><div class="breach-guide-card"><b>6 · Run / Assault</b>Move up to 2×M. If Assaulting, declare the target before moving; an unordered target may pull a die for a responsive Fire Order at −2 Initiative.</div></div><div class="breach-guide-note">Order-die safeguard: after four dice from the same warband are drawn in a row, the opposing player may openly choose who receives the next order die; blind draws then resume. ${pageLink(9, 'Rule')}</div></div>`;
    if (phase === 2) return `<div class="breach-guide-phase"><div class="breach-guide-phase-head"><h3>2. Special Actions Phase</h3>${pageLink(10)}</div><div class="breach-guide-callout">Each player chooses <b>three living Specialists and/or Alphas</b> to take one special action each. A model that just used <b>Cover Fire</b> or <b>Run/Assault</b> in Phase 1 cannot be selected.</div><div class="breach-guide-steps"><div class="breach-guide-step">The player who <b>did not</b> assign the first order die in Phase 1 takes the first special action.</div><div class="breach-guide-step">Choose one eligible selected Alpha/Specialist and resolve one special action immediately.</div><div class="breach-guide-step">Players alternate special actions until all selected models have taken theirs. Mark completed special actions with a token on the model's order die.</div></div><div class="breach-guide-grid"><div class="breach-guide-card"><b>Focus Fire</b>Resolve like Fire, but the target loses positive Initiative modifiers from cover and/or being Down. A psychic may cast instead. An Advance earlier this turn still gives −1 Initiative.</div><div class="breach-guide-card"><b>Assault</b>Resolve similarly to an Assault Order, but movement is not doubled. The target may respond with Fire only if it is itself eligible for a special action and has not used one yet.</div><div class="breach-guide-card"><b>Ambush</b>Go Down and place an Ambush token. During enemy movement in line-of-sight, interrupt the move to Fire, Cover Fire, or Run/Assault under the Ambush rules.</div><div class="breach-guide-card"><b>Mend</b>Roll D6 and regain that much Health, up to the model's starting maximum.</div></div></div>`;
    return `<div class="breach-guide-phase"><div class="breach-guide-phase-head"><h3>3. End Phase</h3>${pageLink(11)}</div><div class="breach-guide-callout">Clean the table state, put the order dice back in the bag, then begin the next turn.</div><div class="breach-guide-steps"><div class="breach-guide-step">Remove remaining casualties and unnecessary temporary tokens from the table.</div><div class="breach-guide-step">Collect all order dice and return them to the bag for the next turn.</div><div class="breach-guide-step">Resolve any scenario-specific end-of-turn or battle-end instructions separately, then start the next turn if the battle continues.</div></div><div class="breach-guide-note">The core rules say games typically run six turns, but this guide deliberately does not enforce a turn limit, deployment method, objective, scoring method, or scenario event. ${pageLink(11, 'Core end phase')}</div></div>`;
  }

  function renderGuide() {
    const panel = qs('#breachTurnGuide'); const toggle = qs('#breachGuideToggle'); if (!panel || !toggle) return;
    panel.classList.toggle('open', guideState.open); toggle.classList.toggle('active', guideState.open);
    toggle.textContent = guideState.open ? 'Hide turn guide' : `Turn ${playState.turn} · Turn guide`; toggle.setAttribute('aria-expanded', String(guideState.open));
    qsa('[data-guide-phase]', panel).forEach(button => {
      const active = Number(button.dataset.guidePhase) === guideState.phase; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
    });
    const body = qs('.breach-guide-body', panel); if (body) body.innerHTML = phaseHtml(guideState.phase); renderTurnDisplays();
  }

  function installBreachGuide() {
    const breach = qs('#breachView'); const content = breach && qs('#breachContent', breach);
    if (!breach || !content || qs('#breachGuideBottomWrap', breach)) return;
    const wrap = document.createElement('div'); wrap.id = 'breachGuideBottomWrap'; wrap.className = 'breach-guide-bottom-wrap';
    const toggle = document.createElement('button'); toggle.id = 'breachGuideToggle'; toggle.type = 'button'; toggle.className = 'breach-guide-toggle'; toggle.setAttribute('aria-controls', 'breachTurnGuide');
    const panel = document.createElement('section'); panel.id = 'breachTurnGuide'; panel.className = 'breach-turn-guide'; panel.setAttribute('aria-label', 'Scenario-agnostic turn walkthrough');
    panel.innerHTML = `<div class="breach-guide-head"><div><div class="breach-guide-kicker">SCENARIO-AGNOSTIC GAMEPLAY</div><h2>Turn walkthrough</h2><div class="breach-guide-sub">Core phase flow only. Scenario setup, objectives, scoring and special events stay separate.</div></div><div class="breach-guide-turn" aria-label="Turn tracker"><b>Turn</b><button type="button" data-guide-act="turn-down" aria-label="Previous turn">−</button><output data-breach-turn-output>${playState.turn}</output><button type="button" data-guide-act="turn-up" aria-label="Next turn">+</button></div></div><div class="breach-guide-nav" role="group" aria-label="Turn phases">${PHASES.map(phase => `<button type="button" data-guide-phase="${phase.n}">${phase.n} · ${phase.short}</button>`).join('')}</div><div class="breach-guide-body" aria-live="polite"></div><div class="breach-guide-footer"><div class="breach-guide-manuals">${pageLink(8, 'Orders p.8')}${pageLink(9, 'Flow p.9')}${pageLink(10, 'Actions p.10')}${pageLink(11, 'End p.11')}</div><div class="phase-move"><button type="button" data-guide-act="prev">← Previous phase</button><button type="button" class="primary" data-guide-act="next">Next phase →</button></div></div>`;
    wrap.append(toggle, panel); content.insertAdjacentElement('afterend', wrap);
    toggle.addEventListener('click', () => {
      guideState.open = !guideState.open; saveGuideState(); renderGuide(); if (guideState.open) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    panel.addEventListener('click', event => {
      const phaseButton = event.target.closest('[data-guide-phase]');
      if (phaseButton) { guideState.phase = clamp(phaseButton.dataset.guidePhase, 1, 3); saveGuideState(); renderGuide(); return; }
      const button = event.target.closest('[data-guide-act]'); if (!button) return;
      const action = button.dataset.guideAct;
      if (action === 'turn-up') changeTurn(1); if (action === 'turn-down') changeTurn(-1);
      if (action === 'next') { if (guideState.phase < 3) guideState.phase += 1; else { guideState.phase = 1; changeTurn(1); } }
      if (action === 'prev') { if (guideState.phase > 1) guideState.phase -= 1; else if (playState.turn > 1) { changeTurn(-1); guideState.phase = 3; } }
      saveGuideState(); renderGuide();
    });
    renderGuide();
  }

  function applyReleaseLabel() {
    document.documentElement.dataset.uiRelease = RELEASE;
    document.title = document.title.replace(/v0\.\d+\.\d+/g, `v${RELEASE}`);
    document.querySelectorAll('small').forEach(element => {
      if (/v0\.\d+\.\d+/.test(element.textContent)) element.textContent = element.textContent.replace(/v0\.\d+\.\d+/g, `v${RELEASE}`);
    });
  }

  function init() {
    installThemeDefaultMigration(); installThemeLayerControls(); installFactionReferenceToggle(); installFactionEmphasis();
    installRosterAddModel(); installBreachGameplay(); installBreachGuide(); applyReleaseLabel();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();