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
