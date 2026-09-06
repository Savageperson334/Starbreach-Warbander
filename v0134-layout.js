(() => {
  const qs = (s, root = document) => root.querySelector(s);

  function emphasizeFaction(){
    const select = qs('#faction');
    const label = select?.closest('label');
    if(!select || !label) return;
    label.classList.add('faction-field');
    [...label.childNodes].forEach(node => {
      if(node.nodeType === Node.TEXT_NODE && node.textContent.trim().toLowerCase() === 'faction') node.remove();
    });
    if(!qs('.faction-label-text', label)){
      const title = document.createElement('span');
      title.className = 'faction-label-text';
      title.textContent = 'FACTION';
      label.insertBefore(title, select);
    }
  }

  function integrateAddModel(){
    const warband = qs('#warbandSettings');
    const add = qs('.add-panel');
    if(!warband || !add || add.parentElement === warband) return;

    add.className = 'warband-add-section';
    add.setAttribute('aria-label','Add model to warband');

    const oldTitle = qs('h2', add);
    if(oldTitle){
      const head = document.createElement('div');
      head.className = 'add-model-head';
      head.innerHTML = '<div><div class="add-model-kicker">WARband construction</div><h2 class="add-model-title">Add model</h2></div>';
      oldTitle.replaceWith(head);
    }

    const help = qs('.add-help', add);
    if(help && !help.closest('.add-help-details')){
      const details = document.createElement('details');
      details.className = 'add-help-details';
      const summary = document.createElement('summary');
      summary.textContent = 'How model rules are handled';
      help.replaceWith(details);
      details.append(summary, help);
    }

    warband.appendChild(add);
  }

  function bumpVersion(){
    document.title = document.title.replace(/v0\.13\.3/g,'v0.13.4');
    document.querySelectorAll('small').forEach(el => {
      if(el.textContent.includes('v0.13.3')) el.textContent = el.textContent.replace('v0.13.3','v0.13.4');
    });
  }

  emphasizeFaction();
  integrateAddModel();
  bumpVersion();
})();
