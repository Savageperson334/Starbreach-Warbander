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
