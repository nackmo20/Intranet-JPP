from pathlib import Path
order=['core/model.js','core/normalize.js','core/matching.js','core/diff.js','adapters/zip.js','adapters/excel.js','adapters/importers.js','core/job.js','core/workspace.js','ui/app.js']
base=Path('src/studio')
js='\n'.join((base/p).read_text(encoding='utf-8') for p in order)
css=(base/'styles.css').read_text(encoding='utf-8')
html=(base/'index.html').read_text(encoding='utf-8').replace('__CSS__',css).replace('__JS__',js)
Path('dist').mkdir(exist_ok=True)
Path('dist/studio-intranet-eafc-v2.html').write_text(html,encoding='utf-8')
print('dist/studio-intranet-eafc-v2.html', len(html), 'bytes')
