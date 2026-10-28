#!/usr/bin/env python3
"""Fetch or verify the eight captured L1EM tiles and optionally rebuild embedded data.

Uses Python's standard library. Captured hashes reject later source drift.
"""
from __future__ import annotations
import argparse,base64,hashlib,json,pathlib,urllib.request

BASE=pathlib.Path(__file__).resolve().parent

def jpeg_size(data):
    if not data.startswith(b'\xff\xd8'):
        raise ValueError('Not a JPEG image')
    i=2
    while i+4<len(data):
        if data[i]!=255:
            raise ValueError('Malformed JPEG marker')
        while data[i]==255:i+=1
        marker=data[i];i+=1
        if marker in (0xD8,0xD9):continue
        size=int.from_bytes(data[i:i+2],'big')
        if size<2 or i+size>len(data):raise ValueError('Malformed JPEG segment')
        if marker in (0xC0,0xC1,0xC2,0xC3,0xC5,0xC6,0xC7,0xC9,0xCA,0xCB,0xCD,0xCE,0xCF):
            return int.from_bytes(data[i+5:i+7],'big'),int.from_bytes(data[i+3:i+5],'big')
        i+=size
    raise ValueError('JPEG has no supported frame dimensions')

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--manifest',type=pathlib.Path,default=BASE/'em-manifest.json')
    p.add_argument('--output',type=pathlib.Path,default=BASE)
    p.add_argument('--verify-only',action='store_true')
    p.add_argument('--embed-output',type=pathlib.Path,help='Write a rebuilt embedded em-assets JSON')
    args=p.parse_args()
    manifest=json.loads(args.manifest.read_text(encoding='utf-8-sig'))
    images=[]
    for im in manifest['images']:
        destination=args.output/im['filename']
        if args.verify_only:
            data=destination.read_bytes()
        else:
            request=urllib.request.Request(im['sourceUrl'],headers={'User-Agent':'SynapseAtlas/4 scientific-data-reproducer'})
            with urllib.request.urlopen(request,timeout=30) as response:data=response.read()
        digest=hashlib.sha256(data).hexdigest()
        if digest!=im['sha256']:
            raise ValueError('Source drift or corruption: '+im['id'])
        if jpeg_size(data)!=(im['width'],im['height']):
            raise ValueError('Unexpected image dimensions: '+im['id'])
        if not args.verify_only:
            destination.parent.mkdir(parents=True,exist_ok=True)
            destination.write_bytes(data)
        images.append({**im,'src':'data:image/jpeg;base64,'+base64.b64encode(data).decode('ascii')})
    if args.embed_output:
        template=json.loads((BASE/'em-assets.json').read_text(encoding='utf-8-sig'))
        template['images']=images
        args.embed_output.parent.mkdir(parents=True,exist_ok=True)
        args.embed_output.write_text(json.dumps(template,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    print(json.dumps({'verifiedTiles':len(images),'bytes':sum(im['bytes'] for im in images),'hashes':'all matched','dimensions':'all matched','embeddedOutput':str(args.embed_output) if args.embed_output else None}))

if __name__=='__main__':main()
