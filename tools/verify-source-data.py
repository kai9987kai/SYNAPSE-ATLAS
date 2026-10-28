#!/usr/bin/env python3
"""Verify bundled source bytes and declared data invariants without network access."""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAX_SAFE_INTEGER = 2**53 - 1


def read_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def source_path(base: Path, relative: str) -> Path:
    path = (base / relative).resolve()
    if not path.is_relative_to(base.resolve()):
        raise ValueError('Source path leaves its declared data folder')
    return path


def verify_hash(path: Path, expected: str) -> bytes:
    contents = path.read_bytes()
    if hashlib.sha256(contents).hexdigest() != expected:
        raise ValueError('Source SHA-256 mismatch: ' + str(path.relative_to(ROOT)))
    return contents


def jpeg_shape(contents: bytes):
    if contents[:2] != b'\xff\xd8':
        raise ValueError('Expected a source JPEG')
    pos = 2
    while pos < len(contents):
        if contents[pos] != 255:
            raise ValueError('Invalid JPEG marker stream')
        while pos < len(contents) and contents[pos] == 255:
            pos += 1
        marker = contents[pos]
        pos += 1
        if marker in (0x01, 0xD8) or 0xD0 <= marker <= 0xD7:
            continue
        if marker in (0xD9, 0xDA):
            break
        length = int.from_bytes(contents[pos:pos + 2], 'big')
        if length < 2 or pos + length > len(contents):
            raise ValueError('Invalid JPEG segment length')
        if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
                      0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
            payload = contents[pos + 2:pos + length]
            return (int.from_bytes(payload[3:5], 'big'),
                    int.from_bytes(payload[1:3], 'big'), payload[0], payload[5])
        pos += length
    raise ValueError('No JPEG dimensions found')


def verify_versions(value, versions: dict[str, str]) -> int:
    count = 0
    if isinstance(value, dict):
        if 'vfbTermRecordVersion' in value:
            version = value['vfbTermRecordVersion']
            if not isinstance(version, str) or version != versions[value['vfbTermId']]:
                raise ValueError('VFB term record version must be an exact captured decimal string')
            count += 1
        count += sum(verify_versions(v, versions) for v in value.values())
    elif isinstance(value, list):
        count += sum(verify_versions(v, versions) for v in value)
    return count


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--built-html', type=Path,
                        help='Also compare this built HTML with the captured release hash')
    args = parser.parse_args()
    public = read_json(ROOT / 'source/public-data.json')
    report = {'networkAccess': False}
    graph_rows = 0
    for graph in public['graphs']:
        ids = [n['id'] for n in graph['nodes']]
        if any(not isinstance(i, str) or not i for i in ids) or len(set(ids)) != len(ids):
            raise ValueError('Invalid or duplicate declared graph identifiers: ' + graph['id'])
        known, total = set(ids), 0
        for row in graph['edges']:
            a, b, weight = (row[0], row[1], row[2]) if isinstance(row, list) else (
                row['From'], row['To'], row['Synapses'])
            if a not in known or b not in known:
                raise ValueError('Unknown graph endpoint: ' + graph['id'])
            if type(weight) is not int or not 0 < weight <= MAX_SAFE_INTEGER:
                raise ValueError('Weight must be a positive safe integer: ' + graph['id'])
            total += weight
        if total > MAX_SAFE_INTEGER:
            raise ValueError('Unsafe graph weight total: ' + graph['id'])
        graph_rows += len(graph['edges'])
    report.update(graphs=len(public['graphs']), graphRows=graph_rows)

    worm_base = ROOT / 'data/witvliet2021'
    worm_manifest = read_json(worm_base / 'source-files.json')
    worm_names = [item['file'] for item in worm_manifest['files']]
    expected_worms = {'originals/witvliet_2020_' + str(i) + '.json' for i in range(1, 9)}
    if not expected_worms.issubset(worm_names) or len(set(worm_names)) != len(worm_names):
        raise ValueError('All eight distinct captured worm specimens must be verified')
    for item in worm_manifest['files']:
        verify_hash(source_path(worm_base, item['file']), item['sha256'])
    report['wormOriginalFiles'] = len(worm_manifest['files'])

    morphology_files, linked_files = 0, 0
    morphology_ids = [cell['id'] for cell in public['morphology']]
    if len(set(morphology_ids)) != len(morphology_ids):
        raise ValueError('Duplicate captured morphology identifier')
    for cell in public['morphology']:
        if not isinstance(cell['id'], str) or not cell['id'].isdigit():
            raise ValueError('Invalid morphology identifier')
        if cell.get('graphDatasetId'):
            path = ROOT / 'data/linked-larva' / ('larva-' + cell['id'] + '.swc')
            linked_files += 1
        else:
            path = ROOT / 'data' / ('malecns-' + cell['id'] + '.swc')
        raw = verify_hash(path, cell['source']['sha256']).decode('utf-8-sig')
        parsed = []
        for line in raw.splitlines():
            if not line.strip() or line.lstrip().startswith('#'):
                continue
            values = [float(x) for x in line.split()[:7]]
            if len(values) != 7 or not all(math.isfinite(x) for x in values):
                raise ValueError('Malformed source SWC')
            if values[5] == -1:
                values[5] = 0  # Documented unknown-radius normalization only.
            parsed.append(values)
        if parsed != cell['nodes']:
            raise ValueError('Embedded skeleton differs from parsed original: ' + cell['id'])
        morphology_files += 1
    if morphology_files < 10 or linked_files < 8:
        raise ValueError('All ten captured skeletons, including eight linked larval cells, are required')
    report['morphologyOriginalFiles'] = morphology_files

    linked = ROOT / 'data/linked-larva'
    records = read_json(linked / 'vfb-neuron-records.json')
    versions = {d['id']: str(d['_version_']) for d in records['response']['docs']}
    report['exactVfbVersionFields'] = verify_versions(public, versions) + verify_versions(
        read_json(linked / 'larval-linked-morphology.json'), versions)
    if report['exactVfbVersionFields'] < 24:
        raise ValueError('Missing captured VFB record-version fields')

    em_base = ROOT / 'data/serial-em'
    em = read_json(em_base / 'em-assets.json')
    embedded = {t['id']: t for t in public['em']['images']}
    original_ids = {t['id'] for t in em['images']}
    if (len(original_ids) < 8 or len(original_ids) != len(em['images'])
            or len(embedded) != len(public['em']['images']) or set(embedded) != original_ids):
        raise ValueError('All eight distinct source EM images must be embedded')
    res, translation = em['source']['resolutionNm'], em['source']['translationNm']
    for tile in em['images']:
        contents = verify_hash(source_path(em_base, tile['filename']), tile['sha256'])
        image = embedded[tile['id']]
        if base64.b64decode(image['src'].split(',', 1)[1], validate=True) != contents:
            raise ValueError('Embedded EM bytes differ from original source')
        if jpeg_shape(contents) != (tile['width'], tile['height'], 8, 1):
            raise ValueError('EM dimensions, grayscale components or bit depth differ')
        expected = {
            'pixelSizeNm': res['x'] * 2**tile['zoomLevel'],
            'xOriginUm': (translation['x'] + tile['col'] * tile['width'] * res['x'] * 2**tile['zoomLevel']) / 1000,
            'yOriginUm': (translation['y'] + tile['row'] * tile['height'] * res['y'] * 2**tile['zoomLevel']) / 1000,
            'zUm': (translation['z'] + tile['zIndex'] * res['z']) / 1000,
        }
        for key, number in expected.items():
            if not math.isclose(tile[key], number, abs_tol=1e-10) or image[key] != tile[key]:
                raise ValueError('Source EM calibration differs: ' + tile['id'])
    metadata = em['source']['metadataEvidence']
    if not {'stack-info.json', 'projects.json', 'stacks.json', 'template-record-live.json'}.issubset(metadata):
        raise ValueError('Missing captured EM metadata evidence')
    for filename, receipt in metadata.items():
        verify_hash(source_path(em_base, filename), receipt['sha256'])
    report.update(emImages=len(em['images']), emMetadataFiles=len(metadata),
                  embeddedEMBytesIdentical=True)

    if args.built_html:
        expected = read_json(ROOT / 'source/build-config.json').get('capturedStandaloneSha256')
        digest = hashlib.sha256(args.built_html.read_bytes()).hexdigest()
        if expected and digest != expected:
            raise ValueError('Built HTML does not match captured release hash')
        report['builtHTML'] = 'matches captured release' if expected else 'capture not set yet'
        report['builtHTMLSha256'] = digest
    print(json.dumps(report, separators=(',', ':')))


if __name__ == '__main__':
    main()
