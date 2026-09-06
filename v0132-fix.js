(() => {
  const qs = (s, root = document) => root.querySelector(s);
  const qsa = (s, root = document) => [...root.querySelectorAll(s)];
  const LAYERS = ['outer', 'section', 'inner'];
  const KEY = 'starbreach-layer-tuning-v1';
  const REF_KEY = 'starbreach-faction-reference-hidden';
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
    if (typeof window.applyTheme === 'function' && window.themeState) {
      window.applyTheme(window.themeState, false);
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
      qs(`#${id}`)?.addEventListener('input', () => queueMicrotask(() => applyLayerTuning(false)));
    }
    qs('#resetTheme')?.addEventListener('click', () => queueMicrotask(() => {
      tuning = { ...defaults };
      saveTuning();
      applyLayerTuning(false);
    }));

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

  installLayerControls();
  installFactionReferenceToggle();
})();
