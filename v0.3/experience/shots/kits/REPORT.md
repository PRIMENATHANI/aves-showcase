# AVES v0.3 kit QC shoot (2026-11-06)

Frames: 72 of 72. Server: existing python http.server on 8765 (left running). Console errors, warnings, 404s: 0 kits affected.

| kit | frame | issue |
|---|---|---|
| oil-gas | d-close | No issues |
| oil-gas | d-step3 | No issues |
| oil-gas | m-close | No issues |
| oil-gas | m-step3 | No issues |
| rig-drilling | d-close | No issues |
| rig-drilling | d-step3 | No issues |
| rig-drilling | m-close | No issues |
| rig-drilling | m-step3 | No issues |
| manufacturing | d-close | No issues |
| manufacturing | d-step3 | No issues |
| manufacturing | m-close | No issues |
| manufacturing | m-step3 | No issues |
| construction | d-close | No issues |
| construction | d-step3 | No issues |
| construction | m-close | No issues |
| construction | m-step3 | No issues |
| mining | d-close | No issues |
| mining | d-step3 | No issues |
| mining | m-close | No issues |
| mining | m-step3 | No issues |
| heavy-machinery | d-close | No issues |
| heavy-machinery | d-step3 | No issues |
| heavy-machinery | m-close | No issues |
| heavy-machinery | m-step3 | No issues |
| assembly-line | d-close | No issues |
| assembly-line | d-step3 | No issues |
| assembly-line | m-close | No issues |
| assembly-line | m-step3 | No issues |
| demolition | d-close | No issues |
| demolition | d-step3 | No issues |
| demolition | m-close | No issues |
| demolition | m-step3 | No issues |
| logistics | d-close | No issues |
| logistics | d-step3 | No issues |
| logistics | m-close | No issues |
| logistics | m-step3 | No issues |
| woodworking | d-close | No issues |
| woodworking | d-step3 | No issues |
| woodworking | m-close | No issues |
| woodworking | m-step3 | No issues |
| aviation | d-close | No issues |
| aviation | d-step3 | No issues |
| aviation | m-close | No issues |
| aviation | m-step3 | No issues |
| railway | d-close | No issues |
| railway | d-step3 | No issues |
| railway | m-close | No issues |
| railway | m-step3 | No issues |
| mechanical | d-close | No issues |
| mechanical | d-step3 | No issues |
| mechanical | m-close | No issues |
| mechanical | m-step3 | No issues |
| power-tool | d-close | No issues |
| power-tool | d-step3 | No issues |
| power-tool | m-close | No issues |
| power-tool | m-step3 | No issues |
| forestry | d-close | No issues |
| forestry | d-step3 | No issues |
| forestry | m-close | No issues |
| forestry | m-step3 | No issues |
| welding | d-close | No issues |
| welding | d-step3 | No issues |
| welding | m-close | No issues |
| welding | m-step3 | No issues |
| electrical | d-close | No issues |
| electrical | d-step3 | No issues |
| electrical | m-close | No issues |
| electrical | m-step3 | No issues |
| cryogenic | d-close | No issues |
| cryogenic | d-step3 | No issues |
| cryogenic | m-close | No issues |
| cryogenic | m-step3 | No issues |

## Layers with status != ok

| layer | status | kits whose order contains it |
|---|---|---|
| (none) | | |

Kits with no manifest entry: none

## Reshoot

Re-shoot one kit (replace KIT). Needs a server on 8765 from the repo root. Run jobs one process at a time; parallel runs reset connections on the single-threaded python server.

```
cd /Users/macintosh/Documents/Claude/Sloane/aves-showcase && K=construction && node v0.3/experience/tools/shoot.mjs "http://127.0.0.1:8765/v0.3/experience/?" v0.3/experience/shots/kits "$K-d-close|kit=$K&step=close|1440|900" "$K-d-step3|kit=$K&step=3|1440|900" "$K-m-close|kit=$K&step=close|390|844" "$K-m-step3|kit=$K&step=3|390|844"
```

For the four regenerating kits, loop: `for K in construction aviation welding cryogenic; do ...; done`. Rebuild the sheets with `.venv/bin/python /Users/macintosh/Documents/Claude/Sloane/aves-showcase/v0.3/experience/shots/kits/make-sheets.py`.

## Manifest note
All 95 layers in manifest.json have status ok (the count moved from 93 to 95 during the shoot, so regeneration is writing to it). These kit order entries have no layer record yet, so those kits shoot without them: aviation (full-body-harness-4, av-101363__on-full-body-harness-4), welding (aves-welding-helmet), cryogenic (thermal-protection-apron). Re-shoot after the regeneration lands.

Update 2026-11-06: the four kits construction, aviation, welding and cryogenic were re-shot after regeneration, clean (no console errors or 404s).
