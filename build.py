"""Refresh the self-contained HTML after editing style.css or app.js."""
from pathlib import Path
import re

root = Path(__file__).resolve().parent
page = root / 'index.html'
html = page.read_text()
for tag, element_id, filename in [
    ('style', 'maximus-styles', 'style.css'),
    ('script', 'maximus-app', 'app.js'),
]:
    content = (root / filename).read_text()
    pattern = rf'<{tag} id="{element_id}">.*?</{tag}>'
    replacement = f'<{tag} id="{element_id}">\n{content}\n</{tag}>'
    html, count = re.subn(pattern, lambda _: replacement, html, flags=re.S)
    if count != 1:
        raise RuntimeError(f'Expected one {element_id} block, found {count}')
page.write_text(html)
print('Built self-contained index.html')
