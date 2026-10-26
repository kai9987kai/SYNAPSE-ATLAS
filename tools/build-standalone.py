#!/usr/bin/env python3
"""Rebuild Synapse Atlas from the bundled source using Python's standard library.

Run from any directory:
    python tools/build-standalone.py
    python tools/build-standalone.py --output path/to/index.html

The default output is the package's index.html. No download or dependency install
is needed. The source modules are the exact compiled modules used in this release.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re

PACKAGE = Path(__file__).resolve().parent.parent
SOURCE = PACKAGE / 'source'


def load_json(name: str):
    return json.loads((SOURCE / name).read_text(encoding='utf-8-sig'))


def script_json(obj) -> str:
    # Escape closing tags so data strings cannot terminate an inline script.
    return json.dumps(obj, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')


def build() -> tuple[str, dict, dict]:
    config = load_json('build-config.json')
    public = load_json('public-data.json')
    research = load_json('research-content.json')
    html = (SOURCE / 'base.html').read_text(encoding='utf-8-sig')
    html = re.sub(r'<title>.*?</title>', '<title>' + config['title'] + '</title>', html, count=1)
    css = (SOURCE / 'upgrade.css').read_text(encoding='utf-8')
    core = (SOURCE / 'atlas-core.js').read_text(encoding='utf-8')
    extension = (SOURCE / 'upgrade.js').read_text(encoding='utf-8')
    for name in ('circuit-core.js', 'morph-core.js'):
        if (SOURCE / name).exists():
            core += '\n' + (SOURCE / name).read_text(encoding='utf-8')
    if (SOURCE / 'studio-v3.css').exists():
        css += '\n' + (SOURCE / 'studio-v3.css').read_text(encoding='utf-8')
    if (SOURCE / 'studio-v3.js').exists():
        extension += '\n' + (SOURCE / 'studio-v3.js').read_text(encoding='utf-8')
    if html.count('</head>') != 1 or html.count('</body>') != 1 or '<script>' not in html:
        raise ValueError('base.html is missing its expected HTML insertion points')
    html = html.replace('</head>', '<style>' + css + '</style></head>')
    html = html.replace('<script>', '<script id="analysisCore">' + core + '</script><script>', 1)
    data = '<script>const PUBLIC_DATA=' + script_json(public) + ';const VERIFIED_CONTENT=' + script_json(research) + ';</script>'
    html = html.replace('</body>', data + '<script>' + extension + '</script></body>')
    return html, public['manifest'], config


def encoded(text: str, config: dict) -> bytes:
    newline = '\r\n' if config.get('newline') == 'CRLF' else '\n'
    return text.replace('\r\n', '\n').replace('\n', newline).encode('utf-8')


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=PACKAGE / 'index.html')
    parser.add_argument('--manifest-output', type=Path, help='Defaults to source-manifest.json beside the output')
    args = parser.parse_args()
    html, manifest, config = build()
    output = args.output.resolve()
    manifest_output = (args.manifest_output or output.with_name('source-manifest.json')).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    manifest_output.parent.mkdir(parents=True, exist_ok=True)
    contents = encoded(html, config)
    output.write_bytes(contents)
    manifest_output.write_bytes(encoded(json.dumps(manifest, ensure_ascii=False, indent=2), config))
    digest = hashlib.sha256(contents).hexdigest()
    print(json.dumps({'output': str(output), 'bytes': len(contents), 'sha256': digest, 'matchesCapturedRelease': digest == config.get('capturedStandaloneSha256'), 'manifest': str(manifest_output)}))


if __name__ == '__main__':
    main()
