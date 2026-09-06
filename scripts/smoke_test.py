from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
index = (ROOT / 'index.html').read_text(encoding='utf-8')
app = (ROOT / 'app.html').read_text(encoding='utf-8')
ui_js = ROOT / 'starbreach-ui.js'
ui_css = ROOT / 'starbreach-ui.css'

def require(condition, message):
    if not condition:
        raise SystemExit(f'SMOKE TEST FAILED: {message}')

require('__FROM_LOCAL_FILE_NOT_SUPPORTED__' not in index + app, 'placeholder text found')
require('fetch(`app.html?fresh=${stamp}`' in index, 'cache-busting loader missing')
require('starbreach-ui.css' in app and 'starbreach-ui.js' in app, 'stable UI assets missing from app')
require('starbreach-ui.css?fresh=${stamp}' in index, 'CSS cache busting missing')
require('starbreach-ui.js?fresh=${stamp}' in index, 'JS cache busting missing')
require(ui_js.exists() and ui_css.exists(), 'consolidated UI files missing')
require('id="faction"' in app, 'Faction selector missing')
require('id="roster"' in app, 'Roster container missing')
require('id="breachView"' in app and 'id="breachContent"' in app, 'BREACH containers missing')
for old in ('v0132-fix', 'v0136-roster-add', 'v0137-breach-guide', 'v0138-breach-guide-bottom'):
    require(old not in index + app, f'legacy runtime reference remains: {old}')

subprocess.run(['node', '--check', str(ui_js)], check=True)
start = index.index('<script>') + len('<script>')
end = index.index('</script>', start)
with tempfile.NamedTemporaryFile('w', suffix='.js', encoding='utf-8', delete=False) as fh:
    fh.write(index[start:end])
    loader_js = fh.name
subprocess.run(['node', '--check', loader_js], check=True)
print('Star Breach smoke checks passed.')
