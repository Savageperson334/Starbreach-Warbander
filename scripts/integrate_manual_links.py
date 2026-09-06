from pathlib import Path
import re

P=Path('index.html')
s=P.read_text(encoding='utf-8')
MANUAL='https://www.starbreach.com/_files/ugd/94fdcd_ee37d7394e564a90813e746ef8da0123.pdf'

s=s.replace('Star Breach Warband Builder — v0.13.2','Star Breach Warband Builder — v0.13.3',1)
s=s.replace('unofficial prototype v0.13.2 • 1st Ed. errata PDF','unofficial prototype v0.13.3 • 1st Ed. errata PDF',1)

old='<div class="brand-row"><h1>STAR BREACH // WARBAND BUILDER</h1><small>unofficial prototype v0.13.3 • 1st Ed. errata PDF</small></div>'
new=f'<div class="brand-row"><h1>STAR BREACH // WARBAND BUILDER</h1><div class="brand-meta"><small>unofficial prototype v0.13.3 • 1st Ed. errata PDF</small><a class="manual-master-link" href="{MANUAL}" target="_blank" rel="noopener">Manual ↗</a></div></div>'
s=s.replace(old,new,1)

css='''\n/* v0.13.3 manual/source links */\n.brand-meta{display:flex;align-items:center;gap:8px}.manual-master-link,.manual-page-link{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--sb-border-strong,#39718a);background:var(--sb-deep,#07101b);color:#e9fbff;text-decoration:none;border-radius:8px;font-size:10px;font-weight:800;line-height:1.1;padding:5px 7px;white-space:nowrap}.manual-master-link:hover,.manual-page-link:hover{border-color:var(--sb-highlight,#62e5ef)}.manual-page-link.manual-pip{font-size:12px;padding:5px 8px}.source-page-links,.manual-link-row,.manual-shortcuts{display:flex;align-items:center;gap:5px;flex-wrap:wrap}.source-page-links{justify-content:flex-end}.manual-shortcuts{padding:8px;border:1px solid var(--sb-border,#28536a);border-radius:9px;background:var(--sb-deep,#07101b)}.manual-shortcuts>span{font-size:10px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}.manual-link-row{margin-top:6px}.rule-name-row,.section-title-with-source{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.rule-name-row{margin-bottom:5px}.rule-name-row .rule-name{margin:0}@media(max-width:720px){.brand-meta small{display:none}.manual-master-link{font-size:10px}.source-page-links{justify-content:flex-start}.manual-page-link{min-height:28px}}@media print{.manual-master-link,.manual-page-link,.manual-shortcuts,.manual-link-row,.source-page-links{display:none!important}}\n'''
s=s.replace('@media print{.theme-panel,.theme-toggle{display:none!important}}',css+'@media print{.theme-panel,.theme-toggle{display:none!important}}',1)

needle="const $=id=>document.getElementById(id), factionSel=$('faction'),picker=$('unitPicker'),rosterEl=$('roster'),breachEl=$('breachView'),pathModeSel=$('pathMode'),pathModeWrap=$('pathModeWrap');"
helper=needle+f"\nconst MANUAL_URL='{MANUAL}';\nconst PSYCHIC_PAGE={{'School of Order':17,'School of Disorder':17,'School of Time':18,'School of Bio-Instinct':18,'Plasmids':19}};\nfunction manualHref(page){{const n=Number(page);return MANUAL_URL+(Number.isFinite(n)&&n>0?`#page=${{Math.trunc(n)}}`:'')}}\nfunction manualPageLink(page,label=null,extra=''){{const n=Number(page);if(!Number.isFinite(n)||n<=0)return'';return `<a class=\"manual-page-link ${{extra}}\" href=\"${{manualHref(n)}}\" target=\"_blank\" rel=\"noopener\">${{esc(label||`PDF p.${{Math.trunc(n)}}`)}}</a>`}}\nfunction manualPagesHtml(pages){{const nums=[...new Set((pages||[]).map(Number).filter(n=>Number.isFinite(n)&&n>0))];return `<span class=\"source-page-links\">${{nums.map(n=>manualPageLink(n,`p.${{n}}`)).join('')}}</span>`}}\nfunction selectionSourcePage(sel){{if(!sel)return 0;const f=factionByName(sel.source_faction||faction().name);const p=f?.source_pages||[];return Number(sel.source_page||p[p.length-1]||p[0]||0)}}"
s=s.replace(needle,helper,1)

# quick manual shortcuts in Warband panel
needle='<div class="stats"><div class="stat"><b id="totalUC">0</b><span>Total UC</span></div><div class="stat"><b id="specUC">0</b><span>Specialist UC</span></div><div class="stat"><b id="modelCount">0</b><span>Models</span></div><div class="stat"><b id="remainingUC">120</b><span>Remaining</span></div></div><div id="warnings" class="stack"></div></section>'
short=f'<div class="stats"><div class="stat"><b id="totalUC">0</b><span>Total UC</span></div><div class="stat"><b id="specUC">0</b><span>Specialist UC</span></div><div class="stat"><b id="modelCount">0</b><span>Models</span></div><div class="stat"><b id="remainingUC">120</b><span>Remaining</span></div></div><div class="manual-shortcuts"><span>Manual</span><a class="manual-page-link" href="{MANUAL}#page=6" target="_blank" rel="noopener">Warbands p.6</a><a class="manual-page-link" href="{MANUAL}#page=12" target="_blank" rel="noopener">Mechanics p.12</a><a class="manual-page-link" href="{MANUAL}#page=17" target="_blank" rel="noopener">Psychic p.17</a><a class="manual-page-link" href="{MANUAL}#page=20" target="_blank" rel="noopener">Skills p.20</a></div><div id="warnings" class="stack"></div></section>'
s=s.replace(needle,short,1)

# profile PDF badge becomes direct link
s=s.replace("return `<div class=\"profile\">${pips}<span class=\"pip\"><small>PDF</small>p.${b.source_page}</span></div>${active?statHelpHtml(active):''}`","return `<div class=\"profile\">${pips}${manualPageLink(b.source_page,`PDF p.${b.source_page}`,'manual-pip')}</div>${active?statHelpHtml(active):''}`",1)

# faction reference page numbers become direct links; each rule gets its faction page
pat=r"function renderReference\(\)\{const f=faction\(\),rules=splitSpecialRules\(f\.special_rules\);\$\('specialRules'\)\.innerHTML=`.*?`;\$\('sourcePages'\)\.textContent='PDF pp\. '\+\(f\.source_pages\|\|\[\]\)\.join\('–'\)\}"
repl="function renderReference(){const f=faction(),rules=splitSpecialRules(f.special_rules),rp=Number(f.source_pages?.[0]||0);$('specialRules').innerHTML=`<div class=\"reference-kicker\">Warband special rules</div><div class=\"rule-list\">${rules.map(r=>`<div class=\"rule-card\"><div class=\"rule-name-row\"><div class=\"rule-name\">${esc(r.name)}</div>${manualPageLink(rp,`p.${rp}`)}</div><div class=\"rule-text\">${esc(r.text)}</div>${dynamicRuleNote(r.name)?`<div class=\"dynamic-rule-note\">${esc(dynamicRuleNote(r.name))}</div>`:''}</div>`).join('')}</div><div class=\"reference-note\">Equipment boxes use structured profile rules; major faction-specific construction rules are automated, while unresolved prose exceptions remain visible for review.</div>`;$('sourcePages').innerHTML=manualPagesHtml(f.source_pages)}"
s,n=re.subn(pat,repl,s,count=1,flags=re.S)
if n!=1: raise SystemExit('renderReference patch failed')

# weapon and relic detail source links
s=s.replace("return `<div class=\"weapon-stats\"><div class=\"weapon-statline\"><span class=\"weapon-stat\"><b>RNG</b>${esc(range)}</span><span class=\"weapon-stat\"><b>ATK</b>${esc(w.attack_rolls??'—')}</span><span class=\"weapon-stat\"><b>DMG</b>${esc(w.damage_bonus??'—')}</span></div>${rules}</div>`","const p=selectionSourcePage(sel);return `<div class=\"weapon-stats\"><div class=\"weapon-statline\"><span class=\"weapon-stat\"><b>RNG</b>${esc(range)}</span><span class=\"weapon-stat\"><b>ATK</b>${esc(w.attack_rolls??'—')}</span><span class=\"weapon-stat\"><b>DMG</b>${esc(w.damage_bonus??'—')}</span></div>${rules}<div class=\"manual-link-row\">${manualPageLink(p,`Armory p.${p}`)}</div></div>`",1)
s=s.replace("return r?.special_effect?`<div class=\"relic-effect\">${esc(r.special_effect)}</div>`:''","const p=selectionSourcePage(sel);return `${r?.special_effect?`<div class=\"relic-effect\">${esc(r.special_effect)}</div>`:''}<div class=\"manual-link-row\">${manualPageLink(p,`Armory p.${p}`)}</div>`",1)

# alpha skill / psychic details
s=s.replace("<div class=\"skill-effect\">${esc(sk.effect)}</div></details>","<div class=\"skill-effect\">${esc(sk.effect)}<div class=\"manual-link-row\">${manualPageLink(20,'Alpha Skills p.20')}</div></div></details>",1)
s=s.replace("const pl=Number(a.power_level||0)+Number(mod||0);return `<details class=\"psy-ability\">","const pl=Number(a.power_level||0)+Number(mod||0),p=PSYCHIC_PAGE[school]||17;return `<details class=\"psy-ability\">",1)
s=s.replace("<div class=\"psy-effect\">${esc(a.effect)}</div></details>","<div class=\"psy-effect\">${esc(a.effect)}<div class=\"manual-link-row\">${manualPageLink(p,`${school} p.${p}`)}</div></div></details>",1)

# base-size source
s=s.replace('print the BREACH sheet at 100% / Actual Size for 1:1 circles.</div>${baseGuideCardsHtml(true)}','print the BREACH sheet at 100% / Actual Size for 1:1 circles. <span class="manual-link-row">${manualPageLink(6,\'Base sizes p.6\')}</span></div>${baseGuideCardsHtml(true)}',1)

s=s.replace('"generated_for":"Unofficial roster-builder prototype v0.13"','"generated_for":"Unofficial roster-builder prototype v0.13.3"',1)
P.write_text(s,encoding='utf-8')
print('integrated manual links')
