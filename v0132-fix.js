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
