"""Build native, annotatable examples captured from the actual service."""
from pathlib import Path
import html
import json
import hashlib
import re
import runpy
service_styles = runpy.run_path(str(Path(__file__).with_name("service-styles.py")))
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
MOBILE = HERE.parent / 'mobile'
if not (MOBILE/'wandeung-wireframe-preview.html').is_file():
    ROOT = HERE.parent
    MOBILE = HERE / 'preview/work/mobile'
documents = {
    'v1': (MOBILE / 'wandeung-v1-embedded.html').read_text(),
    'v2': (MOBILE / 'wandeung-wireframe-preview.html').read_text(),
}
(HERE / 'service-sources.js').write_text('window.designSystemSources=' + json.dumps(documents, ensure_ascii=False) + ';\n')

# Examples are parsed with the page itself, rather than mounted from transient
# iframe documents. This also lets the browser feedback picker see them.
examples = json.loads((HERE / 'service-examples.json').read_text())
style_sources = {kind: service_styles['sources'](MOBILE/file) for kind,file in [('v1','wandeung-v1-embedded.html'),('v2','wandeung-wireframe-preview.html')]}
styles = []
cards = {'component': [], 'utility': []}
def local_paths(text):
    deployed = MOBILE == HERE / 'preview/work/mobile'
    return (text.replace('__DS_BASE__/preview/work/mobile/', 'preview/work/mobile/' if deployed else '../mobile/')
                .replace('__DS_BASE__/preview/static/', 'preview/static/' if deployed else '../../static/')
                .replace('__DS_BASE__/', './'))
for example in examples:
    markup = local_paths(example['html'])
    host = re.search(r'id="([^"]+)"', markup)[1]
    ids = {id[len(host)+1:]: id for id in re.findall(r'\bid="([^"]+)"', markup) if id.startswith(host+'-')}
    for css,source in style_sources[example['kind']]:
        styles.append(service_styles['scoped'](css,source,host,ids))
    adapter = HERE / ('sample-layout-'+example['kind']+'.css')
    styles.append(service_styles['scoped'](adapter.read_text(),adapter,host,ids))
    markup = re.sub(r'<style[^>]*>[\s\S]*?</style>', '', markup)
    markup = markup.replace('<div ', '<div data-sample-kind="'+example['kind']+'" ', 1)
    name = html.escape(example['name'], quote=True)
    cards[example['target']].append('<section data-component-example="'+name+'"><h2>'+name+'</h2>'+markup+'</section>')

index = HERE / 'index.html'
page = index.read_text()
style_block = '<!-- ds-sample-styles:start --><style>\n'+'\n'.join(styles)+'\n</style><!-- ds-sample-styles:end -->'
if '<!-- ds-sample-styles:start -->' in page:
    page = re.sub(r'<!-- ds-sample-styles:start -->[\s\S]*?<!-- ds-sample-styles:end -->', lambda _: style_block, page)
else:
    page = page.replace('</head>', style_block+'</head>')
for target in cards:
    marker = 'ds-'+target+'-examples'
    block = '<!-- '+marker+':start -->'+''.join(cards[target])+'<!-- '+marker+':end -->'
    if '<!-- '+marker+':start -->' in page:
        page = re.sub(r'<!-- '+marker+':start -->[\s\S]*?<!-- '+marker+':end -->', lambda _: block, page)
    else:
        page = page.replace('id="'+target+'-catalog"></div>', 'id="'+target+'-catalog">'+block+'</div>')

def version_asset(match):
    path = match.group(2).split('?')[0]
    asset = HERE / path
    if not asset.is_file():
        return match.group(0)
    digest = hashlib.sha256(asset.read_bytes()).hexdigest()[:12]
    return match.group(1) + path + '?v=' + digest + match.group(3)
page=re.sub(r'((?:href|src)=")([^"<>]+\.(?:css|js)(?:\?[^"<>]*)?)(")', version_asset, page)
index.write_text('\n'.join(line.rstrip() for line in page.split('\n')))
dependencies = {source for group in style_sources.values() for _, source in group}
dependencies.update(HERE/name for name in ['service-examples.json','service-styles.py','sample-layout-v1.css','sample-layout-v2.css','build-preview.py','catalog.js','editor-catalog.js','sample-dom.js'])
(HERE/'source-fingerprints.json').write_text(json.dumps({
    'examples': len(examples),
    'styleSource': 'current-service',
    'files': {str(path.relative_to(ROOT)): hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(dependencies)},
}, ensure_ascii=False, indent=2)+'\n')
print(f'Built {len(examples)} native service examples for design-system preview.')
