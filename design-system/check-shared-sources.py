"""Verify native catalog isolation, live style sources and build freshness."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib
import json
import re
import runpy

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
MOBILE = HERE.parent/'mobile'
if not (MOBILE/'wandeung-wireframe-preview.html').is_file():
    ROOT = HERE.parent
    MOBILE = HERE/'preview/work/mobile'
api = runpy.run_path(str(HERE/'service-styles.py'))

# Meaningful parser cases: nested conditions, commas in functional selectors,
# braces in data URLs, cloned IDs, SVG references and unchanged keyframes.
css = '''@media (max-width:600px){body.mobile-editing .x:is(.a,.b),#field{
color:var(--ink);content:"}";background:url("data:image/svg+xml,{x}")}}
@keyframes pulse{from{opacity:0}to{opacity:1}}
.logo{filter:url(#mask)}'''
scoped = api['scoped'](css,HERE/'fixture.css','sample',{'field':'sample-field','mask':'sample-mask'})
assert '#sample.mobile-editing .x:is(.a,.b),#sample #sample-field{' in scoped
assert 'url("data:image/svg+xml,{x}")' in scoped
assert '@keyframes pulse{from{opacity:0}to{opacity:1}}' in scoped
assert 'url(#sample-mask)' in scoped

class ExampleParser(HTMLParser):
    def __init__(self): super().__init__(); self.ids=[]; self.iframe=0; self.examples=0
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if 'id' in attrs: self.ids.append(attrs['id'])
        self.iframe += tag=='iframe'
        self.examples += 'data-component-example' in attrs

examples=json.loads((HERE/'service-examples.json').read_text())
page=(HERE/'index.html').read_text()
parser=ExampleParser(); parser.feed(page)
assert parser.iframe==0, 'Default catalog must use native, annotatable elements'
assert parser.examples==len(examples)==39
assert len(parser.ids)==len(set(parser.ids)), 'Native example IDs must be unique'
assert all('<style' not in item['html'] for item in examples), 'Captured styles must never become a second source'
assert 'wandeung-v1-embedded.html' in (HERE/'build-preview.py').read_text()
fingerprints=json.loads((HERE/'source-fingerprints.json').read_text())
assert fingerprints['styleSource']=='current-service'
for name,digest in fingerprints['files'].items():
    assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==digest, 'Rebuild stale catalog: '+name

groups=(HERE/'catalog.js').read_text().split('const componentCatalog')[0]
for item in examples:
    if item['target']=='component': assert item['name'] in groups, 'Missing component category: '+item['name']

# V2 aliases must override the editor's legacy local palette as well as :root.
shell=(MOBILE/'v1-page-shell.css').read_text()
for alias in ['control-surface','control-border','selection-bg','selection-ink','selection-border','tab-selection-bg','tab-selection-ink']:
    assert re.search(r'--'+alias+r':var\(--frame-',shell), 'Unmapped editor palette: '+alias
print('PASS: 39 native examples, unique IDs, current service styles, editor palette aliases, categorization, parser isolation and source freshness')
