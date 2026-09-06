from pathlib import Path
import re

SRC = Path('index.html')
OUT = Path('desktop.html')
s = SRC.read_text(encoding='utf-8')


def extract_element(text, start_at, tag):
    start = text.find('<' + tag, start_at)
    if start < 0:
        raise RuntimeError(f'Cannot find <{tag}> from {start_at}')
    token_re = re.compile(rf'</?{tag}\b', re.I)
    depth = 0
    for m in token_re.finditer(text, start):
        closing = text.startswith('</', m.start())
        depth += -1 if closing else 1
        if closing and depth == 0:
            close = text.find('>', m.start())
            if close < 0:
                raise RuntimeError(f'Unclosed </{tag}>')
            return text[start:close+1]
    raise RuntimeError(f'Unbalanced <{tag}> element')


def section_containing(text, marker):
    marker_pos = text.find(marker)
    if marker_pos < 0:
        raise RuntimeError(f'Marker not found: {marker}')
    start = text.rfind('<section', 0, marker_pos)
    if start < 0:
        raise RuntimeError(f'No section before marker: {marker}')
    return extract_element(text, start, 'section')

main_start = s.find('<main>')
main_end = s.find('</main>', main_start)
if main_start < 0 or main_end < 0:
    raise RuntimeError('Main builder element not found')
main_end += len('</main>')
main_html = s[main_start:main_end]

war = section_containing(main_html, 'warbandSettings')
ref = section_containing(main_html, 'factionReferencePanel')
add = section_containing(main_html, 'add-panel')
roster = section_containing(main_html, 'roster-panel')

new_main = f'''<main class="desktop-main">
<aside class="desktop-rail desktop-left">
{war}
{add}
</aside>
{roster}
<aside class="desktop-rail desktop-right">
{ref}
</aside>
</main>'''

s = s[:main_start] + new_main + s[main_end:]
s = re.sub(r'<title>Star Breach Warband Builder[^<]*</title>', '<title>Star Breach Warband Builder — Desktop</title>', s, count=1)
s = s.replace('unofficial prototype v0.13.2 • 1st Ed. errata PDF', 'unofficial desktop layout v0.13.2 • 1st Ed. errata PDF', 1)

needle = '<button class="dock-toggle" id="dockToggle">Minimize</button>'
if needle in s:
    s = s.replace(needle, '<a class="desktop-mode-link" href="index.html" title="Open the responsive/mobile layout">Responsive view</a>' + needle, 1)

css = r'''
/* Desktop layout edition */
@media screen and (min-width:1100px){
  body{font-size:15px}
  .top-shell{z-index:80}
  .brand-row,.dock-main,.dock-extra{max-width:1880px;margin-left:auto;margin-right:auto}
  .desktop-main{max-width:1880px;margin:0 auto;padding:16px 18px 36px;display:grid;grid-template-columns:minmax(270px,320px) minmax(650px,1fr) minmax(300px,360px);gap:16px;align-items:start}
  .desktop-rail{display:grid;gap:14px;align-content:start;min-width:0;position:sticky;top:118px;max-height:calc(100vh - 132px);overflow:auto;overscroll-behavior:contain;padding-bottom:8px;scrollbar-width:thin}
  .desktop-left{grid-column:1}.roster-panel{grid-column:2;min-width:0}.desktop-right{grid-column:3}
  .desktop-rail .panel{box-shadow:0 7px 18px #0006}.desktop-rail .panel.pad{padding:14px}.desktop-rail .stack{gap:10px}
  .desktop-left .warband-panel{order:1}.desktop-left .add-panel{order:2}
  .desktop-right .reference-panel{min-height:0}.desktop-right .faction-ref{max-height:none}
  .roster-panel{padding:16px!important;box-shadow:0 12px 28px #0008}
  .roster{gap:10px}.unitbody{padding:12px;gap:11px}.unithead{padding:10px 12px}.unithead h3{font-size:17px}.unit-mini{max-width:520px}
  .loadout-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.slot{padding:9px;gap:6px}.rule-summary{gap:6px}.rule-line{padding:7px 8px}
  .stats{gap:6px}.stat{padding:7px}.stat b{font-size:18px}
  .theme-panel{padding:10px;gap:9px}.theme-slider{grid-template-columns:92px minmax(0,1fr) 42px;gap:8px}.theme-preview{height:44px}
  .category-tabs{gap:5px}.catbtn{padding:7px 4px}.add-help{font-size:11px}
  #specialRules{font-size:12px}.rule-card{padding:9px}.rule-text{font-size:12px;line-height:1.48}.rule-name{font-size:13px}
  .base-guide-panel,.breach-launch,.roster-file-section{margin-top:10px}
  .desktop-mode-link{display:inline-flex;align-items:center;justify-content:center;border:1px solid #587096;background:#10223a;color:#d9e8f5;text-decoration:none;border-radius:8px;padding:6px 9px;font-size:12px;font-weight:750;white-space:nowrap}
  .desktop-mode-link:hover{border-color:var(--cyan);color:#fff}
}
@media screen and (min-width:1500px){
  .desktop-main{grid-template-columns:320px minmax(760px,1fr) 380px;gap:18px}
  .loadout-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
  .unit-mini{max-width:720px}
}
@media screen and (max-width:1099px){
  .desktop-main{max-width:1380px;margin:auto;padding:20px;display:grid;grid-template-columns:1fr;gap:16px}
  .desktop-rail{display:grid;gap:16px;align-content:start;position:static;max-height:none;overflow:visible}
  .desktop-left{order:1}.roster-panel{order:2}.desktop-right{order:3}
  .desktop-mode-link{display:none}
}
'''

s = s.replace('</style>', css + '</style>', 1)
OUT.write_text(s, encoding='utf-8')
print(f'Generated {OUT} from {SRC}')
