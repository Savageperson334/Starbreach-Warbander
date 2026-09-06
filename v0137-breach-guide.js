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
