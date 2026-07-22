from pathlib import Path
order=['core/model.js','core/state.js','core/report.js','services/click.js','services/dom.js','services/navigation.js','services/ckeditor.js','services/autocomplete.js','services/fancytree.js','services/media.js','services/taxonomy.js','services/sofia.js','core/executor.js','ui/panel.js']
base=Path('src/agent')
meta=(base/'metadata.js').read_text(encoding='utf-8')
js='\n'.join((base/p).read_text(encoding='utf-8') for p in order)
Path('dist').mkdir(exist_ok=True)
Path('dist/agent-drupal-eafc-v2.user.js').write_text(meta+'\n(function(){\n\'use strict\';\n'+js+'\n})();\n',encoding='utf-8')
print('dist/agent-drupal-eafc-v2.user.js', Path('dist/agent-drupal-eafc-v2.user.js').stat().st_size, 'bytes')
