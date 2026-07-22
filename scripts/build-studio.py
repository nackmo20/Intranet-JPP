#!/usr/bin/env python3
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parents[1]
seen = set()
def bundle(file: Path) -> str:
    file = file.resolve()
    if file in seen:
        return ''
    seen.add(file)
    code = file.read_text(encoding='utf-8')
    deps = []
    def repl(match):
        spec = match.group(2)
        deps.append(bundle((file.parent / spec).resolve()))
        return ''
    code = re.sub(r"^import\s+([^'\";]+)\s+from\s+['\"](.+?)['\"];?", repl, code, flags=re.M)
    code = re.sub(r"^export\s+", "", code, flags=re.M)
    return "\n".join(deps) + f"\n// {file.relative_to(ROOT)}\n" + code
html = (ROOT / 'src/studio/index.html').read_text(encoding='utf-8')
css = (ROOT / 'src/studio/styles/main.css').read_text(encoding='utf-8')
js = bundle(ROOT / 'src/studio/ui/app.js')
html = html.replace('__CSS__', css).replace("__JS__\nimport { mount } from './ui/app.js';", js).replace('type="module"', '')
out = ROOT / 'dist/studio-intranet-eafc-v2.html'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html, encoding='utf-8')
print(out.relative_to(ROOT))
