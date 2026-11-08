"""Scope the current service styles, never a captured CSS snapshot.

This small CSS block scanner preserves strings, comments, functions and nested
conditional rules. It does not parse or rewrite declaration values except URLs
and references to cloned IDs.
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import re

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]

class StyleSources(HTMLParser):
    def __init__(self, path):
        super().__init__(); self.path=path; self.sources=[]; self.inline=None; self.base=path.parent
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if tag=='base' and attrs.get('href'):
            self.base=(self.path.parent/attrs['href']).resolve()
        if tag=='style': self.inline=[]
        if tag=='link' and attrs.get('rel')=='stylesheet':
            url=urlsplit(attrs.get('href',''))
            if url.scheme: raise ValueError('Service CSS must be local: '+url.geturl())
            p=(self.base/unquote(url.path)).resolve()
            self.sources.append((p.read_text(),p))
    def handle_data(self,data):
        if self.inline is not None: self.inline.append(data)
    def handle_endtag(self,tag):
        if tag=='style' and self.inline is not None:
            self.sources.append((''.join(self.inline),self.path)); self.inline=None

def sources(path):
    parser=StyleSources(path); parser.feed(path.read_text()); return parser.sources

def split_selectors(text):
    parts=[]; start=0; depth=0; quote=''; i=0
    while i<len(text):
        c=text[i]
        if quote:
            if c=='\\': i+=2; continue
            if c==quote: quote=''
        elif c in '\"\'': quote=c
        elif c in '([': depth+=1
        elif c in ')]': depth-=1
        elif c==',' and not depth: parts.append(text[start:i]); start=i+1
        i+=1
    return parts+[text[start:]]

def blocks(css):
    """Yield (prelude, body|None); braces in data URLs/strings are ignored."""
    css=re.sub(r'/\*[\s\S]*?\*/','',css)
    start=0; depth=0; quote=''; parens=0; brace=None; i=0
    while i<len(css):
        c=css[i]
        if quote:
            if c=='\\': i+=2; continue
            if c==quote: quote=''
        elif c in '\"\'': quote=c
        elif c=='(': parens+=1
        elif c==')': parens-=1
        elif not parens:
            if c=='{':
                if depth==0: brace=i
                depth+=1
            elif c=='}':
                depth-=1
                if depth==0:
                    yield css[start:brace].strip(),css[brace+1:i];start=i+1
            elif c==';' and depth==0:
                yield css[start:i].strip(),None;start=i+1
        i+=1
    if depth or quote or parens: raise ValueError('Unbalanced service CSS')
    if css[start:].strip(): yield css[start:].strip(),None

def scoped(css, source, host, ids):
    def rewrite(text):
        return re.sub(r'#([\w-]+)',lambda m:'#'+ids.get(m[1],m[1]),text)
    def urls(text):
        def url(m):
            value=m[2]
            if value.startswith(('#','data:','http:','https:','blob:')): return rewrite(m[0]) if value.startswith('#') else m[0]
            parsed=urlsplit(value); file=(source.parent/unquote(parsed.path)).resolve()
            import os
            relative=os.path.relpath(file,HERE)
            return 'url("'+relative+('?' + parsed.query if parsed.query else '')+'")'
        return re.sub(r'url\(([\"\']?)([^)\"\'\s]+)\1\)',url,text)
    def selectors(text):
        out=[]
        for part in split_selectors(text):
            part=rewrite(re.sub(r'(?<![\w-])(?:html|body)(?![\w-])',':scope',part.strip()).replace(':root',':scope'))
            out.append(part.replace(':scope','#'+host) if part.startswith(':scope') else '#'+host+' '+part.replace(':scope','#'+host))
        return ','.join(out)
    out=[]
    for prelude,body in blocks(css):
        if not prelude: continue
        if prelude.startswith('@font-face'): continue # Shared fonts are loaded once by the catalog.
        if prelude.startswith('@import'):
            imported=re.fullmatch(r'@import\s+url\(["\']?([^"\')]+)["\']?\)',prelude)
            if not imported: raise ValueError('Unsupported service import: '+prelude)
            url=urlsplit(imported[1])
            if url.scheme: raise ValueError('Service CSS imports must be local')
            path=(source.parent/unquote(url.path)).resolve()
            out.append(scoped(path.read_text(),path,host,ids)); continue
        if body is None: out.append(urls(prelude)+';'); continue
        if prelude.startswith(('@keyframes','@-webkit-keyframes','@property')): out.append(prelude+'{'+urls(rewrite(body))+'}'); continue
        if prelude.startswith('@'):
            out.append(prelude+'{'+scoped(body,source,host,ids)+'}');continue
        out.append(selectors(prelude)+'{'+urls(rewrite(body))+'}')
    return '\n'.join(out)
