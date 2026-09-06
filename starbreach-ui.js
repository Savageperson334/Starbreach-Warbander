(() => {
  const qs = (s, root = document) => root.querySelector(s);
  const qsa = (s, root = document) => [...root.querySelectorAll(s)];
  const LAYERS = ['outer', 'section', 'inner'];
  const KEY = 'starbreach-layer-tuning-v1';
  const REF_KEY = 'starbreach-faction-reference-hidden';
  const ADD_KEY = 'starbreach-dock-add-collapsed';
  const THEME_KEY = 'starbreach-theme-v1';
  const THEME_MIGRATION_KEY = 'starbreach-theme-default-v0135';
  const OLD_THEME = { h: 195, s: 58, v: 48, sep: 72 };
  const NEW_THEME = { h: 192, s: 50, v: 43, sep: 82 };
  const defaults = { selected: 'section', outer: 0, section: 0, inner: 0 };
  let tuning = { ...defaults };

  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') tuning = { ...defaults, ...saved };
  } catch {}
  if (!LAYERS.includes(tuning.selected)) tuning.selected = 'section';
  for (const k of LAYERS) tuning[k] = Math.max(-18, Math.min(18, Number(tuning[k]) || 0));

  function saveTuning() {
    try { localStorage.setItem(KEY, JSON.stringify(tuning)); } catch {}
  }

  function currentThemeFromControls() {
    const num = (id, fallback) => Number(qs(`#${id}`)?.value ?? fallback);
    return {
      h: num('themeHue', NEW_THEME.h),
      s: num('themeSat', NEW_THEME.s),
      v: num('themeVal', NEW_THEME.v),
      sep: num('themeSep', NEW_THEME.sep),
      open: qs('#themePanel')?.classList.contains('open') || false
    };
  }

  function shiftRgb(value, amount) {
    const nums = String(value).match(/[\d.]+/g);
    if (!nums || nums.length < 3) return value;
    const rgb = nums.slice(0, 3).map(Number);
    const p = Math.max(-18, Math.min(18, Number(amount) || 0)) / 100;
    const out = rgb.map(c => Math.round(p >= 0 ? c + (255 - c) * p : c * (1 + p)));
    return `rgb(${out[0]} ${out[1]} ${out[2]})`;
  }

  const layerVars = {
    outer: ['--sb-panel', '--sb-panel-low', '--sb-breach-panel', '--sb-breach-low'],
    section: ['--sb-unit', '--sb-section', '--sb-breach-section'],
    inner: ['--sb-unit-body', '--sb-deep', '--sb-input', '--sb-breach-deep']
  };

  function resetBasePalette() {
    if (typeof window.applyTheme === 'function') {
      window.applyTheme(currentThemeFromControls(), false);
    }
  }

  function applyLayerTuning(resetBase = false) {
    if (resetBase) resetBasePalette();
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    for (const layer of LAYERS) {
      const amount = tuning[layer];
      if (!amount) continue;
      for (const variable of layerVars[layer]) {
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
    const values = {
      themeHue: theme.h,
      themeSat: theme.s,
      themeVal: theme.v,
      themeSep: theme.sep
    };
    for (const [id, value] of Object.entries(values)) {
      const el = qs(`#${id}`);
      if (!el) continue;
      el.value = String(value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function looksLikeOldDefault(saved) {
    if (!saved || typeof saved !== 'object') return true;
    const dh = Math.abs(Number(saved.h) - OLD_THEME.h);
    const deltaHue = Math.min(dh, 360 - dh);
    return deltaHue <= 10 &&
      Math.abs(Number(saved.s) - OLD_THEME.s) <= 10 &&
      Math.abs(Number(saved.v) - OLD_THEME.v) <= 8 &&
      Math.abs(Number(saved.sep) - OLD_THEME.sep) <= 15;
  }

  function installThemeDefaultMigration() {
    let migrated = false;
    try { migrated = localStorage.getItem(THEME_MIGRATION_KEY) === '1'; } catch {}
    if (!migrated) {
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem(THEME_KEY) || 'null'); } catch {}
      if (looksLikeOldDefault(saved)) {
        tuning = { ...defaults };
        saveTuning();
        setThemeViaControls(NEW_THEME);
      } else {
        applyLayerTuning(true);
      }
      try { localStorage.setItem(THEME_MIGRATION_KEY, '1'); } catch {}
    }

    qs('#resetTheme')?.addEventListener('click', () => queueMicrotask(() => {
      tuning = { ...defaults };
      saveTuning();
      setThemeViaControls(NEW_THEME);
      applyLayerTuning(true);
    }));
  }

  function installLayerControls() {
    const preview = qs('.theme-preview');
    const sliders = qs('.theme-sliders');
    if (!preview || !sliders) return;

    preview.removeAttribute('aria-hidden');
    preview.setAttribute('role', 'group');
    preview.setAttribute('aria-label', 'Choose a layer to fine tune');

    qsa('.theme-swatch', preview).forEach(old => {
      if (old.matches('button[data-theme-layer]')) return;
      const layer = LAYERS.find(k => old.classList.contains(k));
      if (!layer) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = old.className;
      btn.textContent = old.textContent;
      btn.dataset.themeLayer = layer;
      btn.setAttribute('aria-pressed', 'false');
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
      tuning.selected = btn.dataset.themeLayer;
      saveTuning();
      updateLayerUi();
    }));

    qs('#themeLayerAdjust')?.addEventListener('input', ev => {
      tuning[tuning.selected] = Number(ev.target.value);
      saveTuning();
      applyLayerTuning(true);
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
      actions = document.createElement('div');
      actions.className = 'faction-ref-actions';
      if (pages) actions.appendChild(pages);
      title.appendChild(actions);
    }

    let btn = qs('#toggleFactionReference');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'toggleFactionReference';
      btn.type = 'button';
      btn.className = 'tiny ghost ref-toggle';
      actions.appendChild(btn);
    }

    let hidden = false;
    try { hidden = localStorage.getItem(REF_KEY) === '1'; } catch {}
    const apply = () => {
      panel.classList.toggle('ref-collapsed', hidden);
      btn.textContent = hidden ? 'Show' : 'Hide';
      btn.setAttribute('aria-expanded', String(!hidden));
    };
    btn.addEventListener('click', () => {
      hidden = !hidden;
      try { localStorage.setItem(REF_KEY, hidden ? '1' : '0'); } catch {}
      apply();
    });
    apply();
  }

  function installFactionEmphasis() {
    const select = qs('#faction');
    const label = select?.closest('label');
    if (!select || !label) return;
    label.classList.add('faction-field');
    if (!qs('.faction-label-text', label)) {
      for (const node of [...label.childNodes]) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().toLowerCase() === 'faction') node.remove();
      }
      const title = document.createElement('span');
      title.className = 'faction-label-text';
      title.textContent = 'Faction';
      label.insertBefore(title, select);
    }
  }

  function installDockAddModel() {
    const top = qs('#topShell');
    const dock = top && qs('.warband-dock', top);
    const panel = qs('.add-panel');
    if (!top || !dock || !panel) return;

    panel.id = 'dockAddModel';
    panel.classList.remove('panel', 'pad', 'stack', 'add-panel');
    panel.classList.add('dock-add-model');
    dock.insertAdjacentElement('afterend', panel);

    const heading = qs('h2', panel);
    const tabs = qs('.category-tabs', panel);
    const profile = qs('label', panel);
    const addButton = qs('#addUnit', panel);
    const help = qs('.add-help', panel);

    const head = document.createElement('div');
    head.className = 'dock-add-head';
    const titleWrap = document.createElement('div');
    titleWrap.className = 'dock-add-title-wrap';
    const kicker = document.createElement('span');
    kicker.className = 'dock-add-kicker';
    kicker.textContent = 'ROSTER';
    if (heading) {
      heading.className = 'dock-add-title';
      titleWrap.append(kicker, heading);
    }
    const toggle = document.createElement('button');
    toggle.id = 'toggleDockAddModel';
    toggle.type = 'button';
    toggle.className = 'tiny ghost dock-add-toggle';
    head.append(titleWrap, toggle);

    const body = document.createElement('div');
    body.className = 'dock-add-body';
    if (tabs) body.appendChild(tabs);
    const controls = document.createElement('div');
    controls.className = 'dock-add-controls';
    if (profile) controls.appendChild(profile);
    if (addButton) controls.appendChild(addButton);
    body.appendChild(controls);

    if (help) {
      const details = document.createElement('details');
      details.className = 'add-help-details';
      const summary = document.createElement('summary');
      summary.textContent = 'Builder rules & automation';
      details.append(summary, help);
      body.appendChild(details);
    }
    panel.replaceChildren(head, body);

    let collapsed = false;
    try { collapsed = localStorage.getItem(ADD_KEY) === '1'; } catch {}
    const apply = () => {
      panel.classList.toggle('collapsed', collapsed);
      toggle.textContent = collapsed ? 'Show' : 'Hide';
      toggle.setAttribute('aria-expanded', String(!collapsed));
    };
    toggle.addEventListener('click', () => {
      collapsed = !collapsed;
      try { localStorage.setItem(ADD_KEY, collapsed ? '1' : '0'); } catch {}
      apply();
    });
    apply();
  }

  installLayerControls();
  installThemeDefaultMigration();
  installFactionReferenceToggle();
  installFactionEmphasis();
  installDockAddModel();
})();
(() => {
  const qs = (s, root = document) => root.querySelector(s);

  function installStyles(){
    if(qs('#v0136RosterAddStyles')) return;
    const style = document.createElement('style');
    style.id = 'v0136RosterAddStyles';
    style.textContent = `
      /* v0.13.6 — Add Model belongs to the roster window, not the global dock. */
      .roster-panel .roster-add-model{
        width:auto;
        margin:12px 0 14px;
        padding:10px 11px 11px;
        border:1px solid color-mix(in srgb,var(--sb-border-strong) 72%,transparent);
        border-left:3px solid color-mix(in srgb,var(--sb-soldier,var(--sb-highlight)) 74%,white 8%);
        border-radius:12px;
        background:linear-gradient(180deg,color-mix(in srgb,var(--sb-section) 91%,var(--sb-soldier,var(--sb-highlight)) 9%),color-mix(in srgb,var(--sb-deep) 96%,transparent));
        box-shadow:inset 0 1px 0 #ffffff0d;
      }
      .roster-panel .roster-add-model .dock-add-head,
      .roster-panel .roster-add-model .dock-add-body{
        max-width:none;
        margin-left:0;
        margin-right:0;
      }
      .roster-panel .roster-add-model .dock-add-head{min-height:28px}
      .roster-panel .roster-add-model .dock-add-kicker{color:color-mix(in srgb,var(--sb-highlight) 62%,white)}
      .roster-panel .roster-add-model .dock-add-title{font-size:13px!important}
      .roster-panel .roster-add-model .dock-add-body{
        grid-template-columns:minmax(220px,.78fr) minmax(320px,1.45fr);
        gap:8px 10px;
        margin-top:7px;
      }
      .roster-panel .roster-add-model .category-tabs{grid-column:1}
      .roster-panel .roster-add-model .dock-add-controls{grid-column:2}
      .roster-panel .roster-add-model .add-help-details{
        grid-column:1/-1;
        justify-self:start;
        min-width:0;
      }
      .roster-panel .roster-add-model .add-help-details:not([open]){width:auto}
      .roster-panel .roster-add-model.collapsed{margin-bottom:10px;padding-top:7px;padding-bottom:7px}

      @media(max-width:760px){
        .roster-panel .roster-add-model{margin:10px 0 12px;padding:9px 9px 10px}
        .roster-panel .roster-add-model .dock-add-body{grid-template-columns:1fr;gap:7px}
        .roster-panel .roster-add-model .category-tabs,
        .roster-panel .roster-add-model .dock-add-controls,
        .roster-panel .roster-add-model .add-help-details{grid-column:1}
        .roster-panel .roster-add-model .dock-add-controls{grid-template-columns:minmax(0,1fr) auto}
      }
      @media(max-width:420px){
        .roster-panel .roster-add-model .dock-add-controls{grid-template-columns:1fr}
        .roster-panel .roster-add-model #addUnit{width:100%}
      }
      @media print{.roster-add-model{display:none!important}}
    `;
    document.head.appendChild(style);
  }

  function relocateAddModel(){
    const panel = qs('#dockAddModel');
    const rosterPanel = qs('.roster-panel');
    if(!panel || !rosterPanel) return;

    const rosterList = qs('#roster', rosterPanel) || qs('.roster', rosterPanel);
    panel.classList.add('roster-add-model');
    panel.setAttribute('aria-label','Add model to this warband');

    const kicker = qs('.dock-add-kicker', panel);
    if(kicker) kicker.textContent = 'WARband';
    const title = qs('.dock-add-title', panel);
    if(title) title.textContent = 'Add model';

    if(rosterList) rosterPanel.insertBefore(panel, rosterList);
    else rosterPanel.appendChild(panel);
  }

  function bumpVersion(){
    document.title = document.title.replace(/v0\.13\.\d+/g,'v0.13.6');
    document.querySelectorAll('small').forEach(el => {
      if(/v0\.13\.\d+/.test(el.textContent)) el.textContent = el.textContent.replace(/v0\.13\.\d+/g,'v0.13.6');
    });
  }

  installStyles();
  relocateAddModel();
  bumpVersion();
})();
(() => {
  const qs = (s, root = document) => root.querySelector(s);
  const MANUAL = 'https://www.starbreach.com/_files/ugd/94fdcd_ee37d7394e564a90813e746ef8da0123.pdf';
  const STORE = 'starbreach-breach-guide-v1';
  const PHASES = [
    { n: 1, short: 'Orders', title: 'Order Dice Phase', page: 9 },
    { n: 2, short: 'Special', title: 'Special Actions Phase', page: 10 },
    { n: 3, short: 'End', title: 'End Phase', page: 11 }
  ];

  let state = { open: false, phase: 1, turn: 1 };
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (saved && typeof saved === 'object') state = { ...state, ...saved };
  } catch {}
  state.phase = Math.max(1, Math.min(3, Number(state.phase) || 1));
  state.turn = Math.max(1, Number(state.turn) || 1);
  state.open = !!state.open;

  const save = () => {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch {}
  };
  const pageHref = p => `${MANUAL}#page=${p}`;
  const pageLink = (p, label = `PDF p.${p}`) => `<a class="breach-guide-page" href="${pageHref(p)}" target="_blank" rel="noopener">${label}</a>`;

  function installStyles() {
    if (qs('#v0137BreachGuideStyles')) return;
    const style = document.createElement('style');
    style.id = 'v0137BreachGuideStyles';
    style.textContent = `
      .breach-actions .guide{background:var(--sb-breach-section,#33264a);border-color:var(--sb-breach-border,#795e91)}
      .breach-actions .guide.active{background:var(--sb-breach-strong,#8f65b5);color:#fff}
      .breach-turn-guide{display:none;margin:14px 0 16px;border:1px solid var(--sb-breach-border,#715786);border-top:3px solid var(--sb-breach-strong,#bd78de);border-radius:14px;background:linear-gradient(180deg,var(--sb-breach-panel,#2d203e),var(--sb-breach-low,#1c172a));box-shadow:0 10px 28px #0008;overflow:hidden}
      .breach-turn-guide.open{display:block}
      .breach-guide-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:12px 13px;border-bottom:1px solid var(--sb-breach-border,#715786);background:color-mix(in srgb,var(--sb-breach-section,#342549) 84%,transparent)}
      .breach-guide-kicker{font-size:9px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:var(--sb-breach-strong,#c38be0)}
      .breach-guide-head h2{margin:2px 0 3px;font-size:20px;line-height:1.1}
      .breach-guide-sub{font-size:11px;line-height:1.35;color:#b9b6c9}
      .breach-guide-turn{display:flex;align-items:center;gap:6px;white-space:nowrap}
      .breach-guide-turn b{font-size:12px;letter-spacing:.06em;text-transform:uppercase}
      .breach-guide-turn button,.breach-guide-nav button,.breach-guide-footer button{border:1px solid var(--sb-breach-border,#715786);background:var(--sb-breach-deep,#1a1524);color:#f5effa;border-radius:8px;font-weight:800;cursor:pointer}
      .breach-guide-turn button{width:30px;height:30px;padding:0;font-size:17px}
      .breach-guide-turn output{min-width:30px;text-align:center;font-size:18px;font-weight:900}
      .breach-guide-nav{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;padding:10px 11px 0}
      .breach-guide-nav button{padding:9px 6px;font-size:11px;line-height:1.2}
      .breach-guide-nav button.active{background:color-mix(in srgb,var(--sb-breach-strong,#a76ad0) 30%,var(--sb-breach-deep,#1a1524));border-color:var(--sb-breach-strong,#a76ad0);box-shadow:inset 0 1px 0 #ffffff18}
      .breach-guide-body{padding:11px}
      .breach-guide-phase{display:grid;gap:9px}
      .breach-guide-phase-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
      .breach-guide-phase-head h3{margin:0;font-size:17px}
      .breach-guide-page{display:inline-flex;align-items:center;text-decoration:none;border:1px solid var(--sb-breach-border,#715786);border-radius:999px;padding:4px 7px;background:var(--sb-breach-deep,#1a1524);color:#efe8f5;font-size:10px;font-weight:850;white-space:nowrap}
      .breach-guide-callout{padding:9px 10px;border-left:3px solid var(--sb-breach-strong,#b476d5);border-radius:8px;background:color-mix(in srgb,var(--sb-breach-section,#342549) 72%,transparent);font-size:12px;line-height:1.45;color:#e8e2ed}
      .breach-guide-steps{display:grid;gap:6px;counter-reset:step}
      .breach-guide-step{display:grid;grid-template-columns:24px minmax(0,1fr);gap:8px;align-items:start;padding:8px 9px;border:1px solid color-mix(in srgb,var(--sb-breach-border,#715786) 78%,transparent);border-radius:9px;background:var(--sb-breach-deep,#1a1524);font-size:12px;line-height:1.4}
      .breach-guide-step::before{counter-increment:step;content:counter(step);display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:color-mix(in srgb,var(--sb-breach-strong,#a76ad0) 26%,var(--sb-breach-deep,#1a1524));border:1px solid var(--sb-breach-strong,#a76ad0);font-size:10px;font-weight:900}
      .breach-guide-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
      .breach-guide-card{padding:8px 9px;border:1px solid color-mix(in srgb,var(--sb-breach-border,#715786) 76%,transparent);border-radius:9px;background:color-mix(in srgb,var(--sb-breach-deep,#1a1524) 88%,black);font-size:11px;line-height:1.4;color:#dcd6e2}
      .breach-guide-card b{display:block;margin-bottom:2px;color:#fff;font-size:12px}
      .breach-guide-note{font-size:10px;line-height:1.4;color:#aaa6b8}
      .breach-guide-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 11px 11px}
      .breach-guide-footer .phase-move{display:flex;gap:7px;margin-left:auto}
      .breach-guide-footer button{padding:7px 9px;font-size:11px}
      .breach-guide-footer button.primary{background:color-mix(in srgb,var(--sb-breach-strong,#a76ad0) 34%,var(--sb-breach-deep,#1a1524));border-color:var(--sb-breach-strong,#a76ad0)}
      .breach-guide-manuals{display:flex;gap:5px;flex-wrap:wrap}
      @media(max-width:620px){
        .breach-guide-head{align-items:center}.breach-guide-head h2{font-size:18px}.breach-guide-sub{font-size:10px}
        .breach-guide-grid{grid-template-columns:1fr}.breach-guide-nav button{padding:8px 3px;font-size:10px}
        .breach-guide-footer{align-items:flex-end;flex-wrap:wrap}.breach-guide-footer .phase-move{width:100%;justify-content:flex-end}
      }
      @media(max-width:390px){.breach-guide-head{gap:7px;padding:10px}.breach-guide-turn b{display:none}.breach-guide-body{padding:9px}.breach-guide-nav{padding-left:9px;padding-right:9px}}
      @media print{#breachGuideToggle,.breach-turn-guide{display:none!important}}
    `;
    document.head.appendChild(style);
  }

  function phaseHtml(phase) {
    if (phase === 1) return `
      <div class="breach-guide-phase">
        <div class="breach-guide-phase-head"><h3>1. Order Dice Phase</h3>${pageLink(9)}</div>
        <div class="breach-guide-callout"><b>Loop:</b> draw a die → assign it → resolve that model's order immediately → draw again. Continue until every order die has been drawn.</div>
        <div class="breach-guide-steps">
          <div class="breach-guide-step">Put the order dice for the models currently on the table into the shared opaque bag and shake it.</div>
          <div class="breach-guide-step">Blindly draw one die. Its color determines which warband receives the activation.</div>
          <div class="breach-guide-step">That player assigns the die to one available model that has not yet taken an order, sets the chosen order face up, and resolves it immediately.</div>
          <div class="breach-guide-step">Remember which player assigned the <b>first order of the turn</b>; that determines who starts the Special Actions Phase.</div>
          <div class="breach-guide-step">Repeat until all dice are drawn. If a model is removed before receiving an order, remove one matching die from the bag.</div>
        </div>
        <div class="breach-guide-phase-head"><h3>Six orders</h3>${pageLink(8, 'PDF p.8')}</div>
        <div class="breach-guide-grid">
          <div class="breach-guide-card"><b>1 · Down</b>No move or shot. +2 Initiative on dodge rolls against ranged attacks. An unordered model targeted by a ranged attack may immediately pull its die and go Down before attack rolls.</div>
          <div class="breach-guide-card"><b>2 · Mend</b>Roll D6 and regain that much Health, up to the model's starting maximum.</div>
          <div class="breach-guide-card"><b>3 · Cover Fire</b>Choose a point in line-of-sight and weapon range. Every model within 2″ becomes a target. Attacker applies −2 Initiative to the attack rolls.</div>
          <div class="breach-guide-card"><b>4 · Fire</b>Fire one equipped weapon at one enemy in line-of-sight and range, or cast a psychic ability if able. Mechs have their stated exception.</div>
          <div class="breach-guide-card"><b>5 · Advance</b>Move up to M, then optionally Fire. The attack or psychic roll gets −1 Initiative for moving first.</div>
          <div class="breach-guide-card"><b>6 · Run / Assault</b>Move up to 2×M. If Assaulting, declare the target before moving; an unordered target may pull a die for a responsive Fire Order at −2 Initiative.</div>
        </div>
        <div class="breach-guide-note">Order-die safeguard: after four dice from the same warband are drawn in a row, the opposing player may openly choose who receives the next order die; blind draws then resume. ${pageLink(9, 'Rule')}</div>
      </div>`;

    if (phase === 2) return `
      <div class="breach-guide-phase">
        <div class="breach-guide-phase-head"><h3>2. Special Actions Phase</h3>${pageLink(10)}</div>
        <div class="breach-guide-callout">Each player chooses <b>three living Specialists and/or Alphas</b> to take one special action each. A model that just used <b>Cover Fire</b> or <b>Run/Assault</b> in Phase 1 cannot be selected.</div>
        <div class="breach-guide-steps">
          <div class="breach-guide-step">The player who <b>did not</b> assign the first order die in Phase 1 takes the first special action.</div>
          <div class="breach-guide-step">Choose one eligible selected Alpha/Specialist and resolve one special action immediately.</div>
          <div class="breach-guide-step">Players alternate special actions until all selected models have taken theirs. Mark completed special actions with a token on the model's order die.</div>
        </div>
        <div class="breach-guide-grid">
          <div class="breach-guide-card"><b>Focus Fire</b>Resolve like Fire, but the target loses positive Initiative modifiers from cover and/or being Down. A psychic may cast instead. An Advance earlier this turn still gives −1 Initiative.</div>
          <div class="breach-guide-card"><b>Assault</b>Resolve similarly to an Assault Order, but movement is not doubled. The target may respond with Fire only if it is itself eligible for a special action and has not used one yet.</div>
          <div class="breach-guide-card"><b>Ambush</b>Go Down and place an Ambush token. During enemy movement in line-of-sight, interrupt the move to Fire, Cover Fire, or Run/Assault under the Ambush rules.</div>
          <div class="breach-guide-card"><b>Mend</b>Roll D6 and regain that much Health, up to the model's starting maximum.</div>
        </div>
      </div>`;

    return `
      <div class="breach-guide-phase">
        <div class="breach-guide-phase-head"><h3>3. End Phase</h3>${pageLink(11)}</div>
        <div class="breach-guide-callout">Clean the table state, put the order dice back in the bag, then begin the next turn.</div>
        <div class="breach-guide-steps">
          <div class="breach-guide-step">Remove remaining casualties and unnecessary temporary tokens from the table.</div>
          <div class="breach-guide-step">Collect all order dice and return them to the bag for the next turn.</div>
          <div class="breach-guide-step">Resolve any scenario-specific end-of-turn or battle-end instructions separately, then start the next turn if the battle continues.</div>
        </div>
        <div class="breach-guide-note">The core rules say games typically run six turns, but this guide deliberately does not enforce a turn limit, deployment method, objective, scoring method, or scenario event. ${pageLink(11, 'Core end phase')}</div>
      </div>`;
  }

  function render() {
    const panel = qs('#breachTurnGuide');
    const toggle = qs('#breachGuideToggle');
    if (!panel || !toggle) return;
    panel.classList.toggle('open', state.open);
    toggle.classList.toggle('active', state.open);
    toggle.textContent = state.open ? 'Hide guide' : 'Turn guide';
    toggle.setAttribute('aria-expanded', String(state.open));

    const turnOut = qs('#breachGuideTurn', panel);
    if (turnOut) turnOut.value = String(state.turn);
    panel.querySelectorAll('[data-guide-phase]').forEach(btn => {
      const active = Number(btn.dataset.guidePhase) === state.phase;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    const body = qs('.breach-guide-body', panel);
    if (body) body.innerHTML = phaseHtml(state.phase);
  }

  function installGuide() {
    const breach = qs('#breachView');
    const head = qs('.breach-page-head', breach);
    const actions = qs('.breach-actions', breach);
    const content = qs('#breachContent', breach);
    if (!breach || !head || !actions || !content || qs('#breachTurnGuide')) return;

    const toggle = document.createElement('button');
    toggle.id = 'breachGuideToggle';
    toggle.type = 'button';
    toggle.className = 'guide';
    toggle.setAttribute('aria-controls', 'breachTurnGuide');
    actions.insertBefore(toggle, qs('#breachPrint', actions) || null);

    const panel = document.createElement('section');
    panel.id = 'breachTurnGuide';
    panel.className = 'breach-turn-guide';
    panel.setAttribute('aria-label', 'Scenario-agnostic turn walkthrough');
    panel.innerHTML = `
      <div class="breach-guide-head">
        <div>
          <div class="breach-guide-kicker">SCENARIO-AGNOSTIC GAMEPLAY</div>
          <h2>Turn walkthrough</h2>
          <div class="breach-guide-sub">Core phase flow only. Scenario setup, objectives, scoring and special events stay separate.</div>
        </div>
        <div class="breach-guide-turn" aria-label="Turn tracker">
          <b>Turn</b><button type="button" data-guide-act="turn-down" aria-label="Previous turn">−</button><output id="breachGuideTurn">1</output><button type="button" data-guide-act="turn-up" aria-label="Next turn">+</button>
        </div>
      </div>
      <div class="breach-guide-nav" role="group" aria-label="Turn phases">
        ${PHASES.map(p => `<button type="button" data-guide-phase="${p.n}">${p.n} · ${p.short}</button>`).join('')}
      </div>
      <div class="breach-guide-body" aria-live="polite"></div>
      <div class="breach-guide-footer">
        <div class="breach-guide-manuals">${pageLink(8, 'Orders p.8')}${pageLink(9, 'Flow p.9')}${pageLink(10, 'Actions p.10')}${pageLink(11, 'End p.11')}</div>
        <div class="phase-move"><button type="button" data-guide-act="prev">← Previous phase</button><button type="button" class="primary" data-guide-act="next">Next phase →</button></div>
      </div>`;
    breach.insertBefore(panel, content);

    toggle.addEventListener('click', () => {
      state.open = !state.open;
      save();
      render();
      if (state.open) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    panel.addEventListener('click', ev => {
      const phaseBtn = ev.target.closest('[data-guide-phase]');
      if (phaseBtn) {
        state.phase = Number(phaseBtn.dataset.guidePhase);
        save();
        render();
        return;
      }
      const btn = ev.target.closest('[data-guide-act]');
      if (!btn) return;
      const act = btn.dataset.guideAct;
      if (act === 'turn-up') state.turn += 1;
      if (act === 'turn-down') state.turn = Math.max(1, state.turn - 1);
      if (act === 'next') {
        if (state.phase < 3) state.phase += 1;
        else { state.phase = 1; state.turn += 1; }
      }
      if (act === 'prev') {
        if (state.phase > 1) state.phase -= 1;
        else if (state.turn > 1) { state.turn -= 1; state.phase = 3; }
      }
      save();
      render();
    });

    render();
  }

  function bumpVersion() {
    document.title = document.title.replace(/v0\.13\.\d+/g, 'v0.13.7');
    document.querySelectorAll('small').forEach(el => {
      if (/v0\.13\.\d+/.test(el.textContent)) el.textContent = el.textContent.replace(/v0\.13\.\d+/g, 'v0.13.7');
    });
  }

  installStyles();
  installGuide();
  bumpVersion();
})();
(() => {
  const qs = (s, root = document) => root.querySelector(s);

  function installStyles(){
    if(qs('#v0138BreachGuideBottomStyles')) return;
    const style = document.createElement('style');
    style.id = 'v0138BreachGuideBottomStyles';
    style.textContent = `
      .breach-guide-bottom-wrap{display:grid;gap:10px;margin:18px 0 8px}
      .breach-guide-bottom-wrap #breachGuideToggle{width:100%;min-height:44px;padding:10px 14px;font-size:13px;font-weight:900;letter-spacing:.04em;border-radius:11px;background:color-mix(in srgb,var(--sb-breach-section,#33264a) 86%,var(--sb-breach-strong,#8f65b5) 14%);border:1px solid var(--sb-breach-border,#795e91);color:#f6effa;box-shadow:inset 0 1px 0 #ffffff14}
      .breach-guide-bottom-wrap #breachGuideToggle.active{background:color-mix(in srgb,var(--sb-breach-strong,#8f65b5) 38%,var(--sb-breach-section,#33264a));border-color:var(--sb-breach-strong,#8f65b5)}
      .breach-guide-bottom-wrap .breach-turn-guide{margin:0}
      @media(max-width:620px){.breach-guide-bottom-wrap{margin-top:14px}.breach-guide-bottom-wrap #breachGuideToggle{min-height:42px}}
      @media print{.breach-guide-bottom-wrap{display:none!important}}
    `;
    document.head.appendChild(style);
  }

  function relocate(){
    const breach = qs('#breachView');
    const content = qs('#breachContent', breach);
    const toggle = qs('#breachGuideToggle', breach);
    const panel = qs('#breachTurnGuide', breach);
    if(!breach || !content || !toggle || !panel) return;

    let wrap = qs('#breachGuideBottomWrap', breach);
    if(!wrap){
      wrap = document.createElement('div');
      wrap.id = 'breachGuideBottomWrap';
      wrap.className = 'breach-guide-bottom-wrap';
      content.insertAdjacentElement('afterend', wrap);
    }

    wrap.append(toggle, panel);
    toggle.textContent = panel.classList.contains('open') ? 'Hide turn guide' : 'Turn guide';
  }

  installStyles();
  relocate();

  // BREACH content can be re-rendered without replacing these controls, but run once
  // more after the current task so the guide always settles below the play sheet.
  queueMicrotask(relocate);
})();

// Keep the displayed release label aligned with the consolidated runtime.
(() => {
  document.title = document.title.replace(/v0\.13\.\d+/g, 'v0.13.8');
  document.querySelectorAll('small').forEach(el => {
    if (/v0\.13\.\d+/.test(el.textContent)) {
      el.textContent = el.textContent.replace(/v0\.13\.\d+/g, 'v0.13.8');
    }
  });
})();
