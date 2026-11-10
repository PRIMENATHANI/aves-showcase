"""v0.4: pull the exact "The AVES Approach" panels out of the catalogue's InDesign source.
Steps 1 and 3 run in DesignCraft (ArtCraft's InDesign-class app, MCP tools mcp__designcraft__* or `designcraft-cli`);
this script is step 2 and step 4.

  1. DesignCraft: file.open <copy of AVES CATALOG REV_JC.indd>  (fonts in a `Document Fonts` folder beside it)
                  file.exportIdml {path: catalog.idml, embedImages: false};  unzip catalog.idml -> idml/
  2. python catalogue_extract.py strip <workdir>      -> <workdir>/approach.idml  (only the six Approach groups, no master art)
  3. DesignCraft: file.open approach.idml; file.exportPdf {path: approach.pdf}
                  pdftocairo -png -transp -r 300 approach.pdf apr
  4. python catalogue_extract.py finish <workdir> <outdir>   -> approach-<category>.png, 1400 px wide, transparent

Notes that cost time: DesignCraft only reads inside its allowed folder (the workspace), not /tmp. It drops the last
letter of "Approach" because its font metrics run a hair wider than InDesign's, so step 2 widens those two text frames
by 22 % each side. Its CMYK-to-RGB turns the panel green lighter than Adobe's, so step 4 shifts greens to Adobe's value
(measured on the Aug 18 PDF: 2,142,74). Ear and Fall keep their panel ungrouped on the spread, so they are found by
position between the green panel frame and the last divider line.
"""
import sys, os, re, glob, zipfile, shutil
import xml.etree.ElementTree as ET
ET.register_namespace('idPkg', 'http://ns.adobe.com/AdobeInDesign/idml/1.0/packaging')
SPREADS = {'head': 3, 'eye': 9, 'hearing': 26, 'respiratory': 31, 'hand': 41, 'fall': 55}   # index in designmap order (REV 7)
SKIP = ('Page', 'FlattenerPreference')
def strip(wd):
    src, dst = os.path.join(wd, 'idml'), os.path.join(wd, 'idml-apr')
    story = lambda sid: ' '.join(re.findall(r'<Content>([^<]*)</Content>', open(f'{src}/Stories/Story_{sid}.xml').read())) if os.path.exists(f'{src}/Stories/Story_{sid}.xml') else ''
    shutil.rmtree(dst, ignore_errors=True); os.makedirs(dst + '/Spreads')
    for d in ('META-INF', 'Resources', 'MasterSpreads', 'Stories', 'XML'):
        if os.path.exists(f'{src}/{d}'): shutil.copytree(f'{src}/{d}', f'{dst}/{d}')
    shutil.copy(f'{src}/mimetype', f'{dst}/mimetype')
    dm = open(f'{src}/designmap.xml').read(); spreads = re.findall(r'<idPkg:Spread src="(Spreads/[^"]+)"\s*/>', dm); kept = []
    for slot, i in SPREADS.items():
        p = spreads[i]; tree = ET.parse(f'{src}/{p}'); sp = tree.getroot().find('Spread'); kids = [c for c in sp if c.tag not in SKIP]
        txt = lambda c: [story(t.get('ParentStory')).strip().lower() for t in c.iter('TextFrame')]
        grp = [c for c in kids if c.tag == 'Group' and 'approach' in txt(c) and len(txt(c)) > 4]
        if grp: keep = set(map(id, grp))
        else:   # ungrouped: from the green panel frame before the "Approach" item to the last divider after the labels
            k = next(n for n, c in enumerate(kids) if 'approach' in txt(c)); a = k - 1; b = k
            while b + 1 < len(kids) and ((kids[b + 1].tag == 'Group' and b + 1 <= k + 1) or kids[b + 1].tag == 'GraphicLine' or (kids[b + 1].tag == 'TextFrame' and len(' '.join(txt(kids[b + 1]))) < 30)): b += 1
            keep = set(map(id, kids[a:b + 1]))
        for c in kids:
            if id(c) not in keep: sp.remove(c)
        tree.write(f'{dst}/{p}', xml_declaration=True, encoding='UTF-8'); kept.append(p)
        x = re.sub(r'AppliedMaster="[^"]*"', 'AppliedMaster="n"', open(f'{dst}/{p}').read()); edits = []
        for m in re.finditer(r'<TextFrame [^>]*ParentStory="([^"]+)"[^>]*>', x):
            if story(m.group(1)).strip().lower() not in ('approach', 'the'): continue
            a0 = m.end(); e0 = x.index('</PathPointArray>', a0); seg = x[a0:e0]; xs = [float(v) for v in re.findall(r'Anchor="(-?[\d.]+) ', seg)]; lo, hi = min(xs), max(xs); g = (hi - lo) * .22
            fix = lambda mm: f'{mm.group(1)}="{float(mm.group(2)) - g if abs(float(mm.group(2)) - lo) < 1e-6 else float(mm.group(2)) + g if abs(float(mm.group(2)) - hi) < 1e-6 else float(mm.group(2))} '
            edits.append((a0, e0, re.sub(r'(Anchor|LeftDirection|RightDirection)="(-?[\d.]+) ', fix, seg)))
        for a0, e0, seg in reversed(edits): x = x[:a0] + seg + x[e0:]
        open(f'{dst}/{p}', 'w').write(x); print(slot, p, 'grouped' if grp else 'ungrouped', 'frames widened', len(edits))
    for p in spreads:
        if p not in kept: dm = dm.replace(f'<idPkg:Spread src="{p}" />', '').replace(f'<idPkg:Spread src="{p}"/>', '')
    open(f'{dst}/designmap.xml', 'w').write(dm)
    out = os.path.join(wd, 'approach.idml'); z = zipfile.ZipFile(out, 'w'); z.write(f'{dst}/mimetype', 'mimetype', compress_type=zipfile.ZIP_STORED)
    for root, _, files in os.walk(dst):
        for f in files:
            full = os.path.join(root, f); arc = os.path.relpath(full, dst)
            if arc != 'mimetype': z.write(full, arc, compress_type=zipfile.ZIP_DEFLATED)
    z.close(); print('wrote', out)
def finish(wd, outdir):
    import numpy as np
    from PIL import Image
    Image.MAX_IMAGE_PIXELS = None; Q = np.array([2, 142, 74.]); P = np.array([42, 158, 66.]); den = P[1] - max(P[0], P[2]); found = []
    for f in sorted(glob.glob(os.path.join(wd, 'apr-[0-9]*.png'))):
        im = Image.open(f).convert('RGBA'); al = np.array(im)[..., 3]
        if (al > 8).sum() < 5000: continue
        ys, xs = np.where(al > 8); found.append(im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)))
    assert len(found) == len(SPREADS), f'expected {len(SPREADS)} panels, found {len(found)}'
    os.makedirs(outdir, exist_ok=True)
    for im, slot in zip(found, SPREADS):
        a = np.array(im).astype(float); s = np.clip((a[..., 1] - np.maximum(a[..., 0], a[..., 2])) / den, 0, 1)[..., None]
        a[..., :3] = np.clip(a[..., :3] + s * (Q - P), 0, 255); out = Image.fromarray(a.astype('uint8')); out = out.resize((1400, int(out.height * 1400 / out.width)), Image.LANCZOS)
        out.save(os.path.join(outdir, f'approach-{slot}.png'), optimize=True); print('ok', slot, out.size)
if __name__ == '__main__':
    strip(sys.argv[2]) if sys.argv[1] == 'strip' else finish(sys.argv[2], sys.argv[3])
