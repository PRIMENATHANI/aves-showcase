"""Industry tiles -> assets/ind-<id>.svg. Six are the supplied AVES tiles (copied). The other six ADS industries have no
supplied tile: their glyphs are the ADS's own vector artwork (page 4 of ads-841r-rev2.pdf via `pdftocairo -svg`, paths
picked out by position in Chrome and saved in industry-glyphs.json), set white in the same green tile frame.
usage: python3 industries.py
"""
import json, os, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.abspath(os.path.join(HERE, '..', '..', 'research.nosync', 'av-841r', 'industry-svg'))
SUPPLIED = {'construction': 'constr', 'oil-gas': 'oil gas', 'manufacturing': 'manufac', 'logistics': 'logist', 'aviation': 'aviation', 'chemical': 'chem'}
FROM_ADS = {'mining': 'Mining', 'offshore': 'Offshore', 'petrochemicals': 'Petrochemicals', 'railroads': 'Railroads', 'rig-drilling': 'Rig Drilling', 'iron-steel': 'Iron & Steel'}
for key, name in SUPPLIED.items(): shutil.copy(os.path.join(SRC, name + '.svg'), os.path.join(HERE, 'assets', f'ind-{key}.svg'))
glyphs = json.load(open(os.path.join(HERE, 'industry-glyphs.json')))
for key, name in FROM_ADS.items():
    g = glyphs[name]; x0, y0, x1, y1 = g['box']; w, h = x1 - x0, y1 - y0
    k = 66 / max(w, h); tx = 64 - (x0 + w / 2) * k; ty = 64 - (y0 + h / 2) * k
    paths = ''.join(f'<path d="{p["d"]}" transform="matrix({" ".join(str(v) for v in p["m"])})" fill-rule="{p["rule"]}"/>' for p in g['parts'] if p['fill'] == 'ink')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect x="4.09" y="4.09" width="119.82" height="119.82" fill="#009845"/>'
           f'<rect x="9.13" y="9.13" width="109.74" height="109.74" fill="#fff"/><rect x="13.9" y="13.9" width="100.2" height="100.2" fill="#009845"/>'
           f'<g fill="#fff" transform="translate({tx:.3f} {ty:.3f}) scale({k:.4f})">{paths}</g></svg>')
    open(os.path.join(HERE, 'assets', f'ind-{key}.svg'), 'w').write(svg); print(key, len(svg))
