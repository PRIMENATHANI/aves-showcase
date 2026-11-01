#!/usr/bin/env python3
"""Validate data/kits.json against data/products.json.

Run from the repo root:  python3 -I tools/check_kits.py
Exits 1 with a list of problems, or prints a per-kit summary table.
"""
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

KITS = [
    ("oil-gas", "Oil & Gas", "Energy"),
    ("rig-drilling", "Rig Drilling", "Energy"),
    ("manufacturing", "Manufacturing", "Make"),
    ("construction", "Construction", "Build"),
    ("mining", "Mining", "Extract & Handle"),
    ("heavy-machinery", "Heavy Machinery", "Build"),
    ("assembly-line", "Assembly Line", "Make"),
    ("demolition", "Demolition", "Build"),
    ("logistics", "Logistics", "Move"),
    ("woodworking", "Woodworking", "Make"),
    ("aviation", "Aviation", "Move"),
    ("railway", "Railway", "Move"),
    ("mechanical", "Mechanical", "Make"),
    ("power-tool", "Power Tool Usage", "Make"),
    ("forestry", "Forestry", "Extract & Handle"),
    ("welding", "Welding & Hot Work", "Make"),
    ("electrical", "Electrical & Arc Flash", "Energy"),
    ("cryogenic", "Cryogenic Handling", "Extract & Handle"),
]
SLOT_ORDER = ["head", "eye", "face", "hearing", "respiratory", "hand", "fall", "dropped", "cryo-body"]
LABELS = {"head": "Head", "eye": "Eye", "face": "Face", "hearing": "Hearing",
          "respiratory": "Respiratory", "hand": "Hand", "fall": "Fall",
          "dropped": "Dropped objects", "cryo-body": "Body"}
CATEGORY = {"head": {"Head"}, "eye": {"Eye"}, "face": {"Face"}, "hearing": {"Hearing"},
            "respiratory": {"Respiratory"}, "hand": {"Hand", "Cryogenic"},
            "fall": {"Fall & Dropped Objects"}, "dropped": {"Fall & Dropped Objects"},
            "cryo-body": {"Cryogenic"}}
REQUIRED = {"head", "eye", "hearing", "hand"}
CONFIDENCE = ("high", "medium", "low")
MAX_PRIMARY_USES = 6
MAX_WHY_WORDS = 16
MAX_INTRO_WORDS = 22
BANNED_CATEGORY = "Eyewash & Showers"


def words(text):
    return len(text.split())


def main():
    products = {p["id"]: p for p in json.loads((ROOT / "data/products.json").read_text())}
    kits = json.loads((ROOT / "data/kits.json").read_text())
    errors = []
    err = errors.append

    if not isinstance(kits, list):
        print("FAIL: kits.json must be a bare JSON array")
        return 1
    if [k.get("id") for k in kits] != [k[0] for k in KITS]:
        err(f"kit ids/order differ: got {[k.get('id') for k in kits]}")

    primary_uses = Counter()
    for i, kit in enumerate(kits):
        kid = kit.get("id", f"#{i}")
        if i < len(KITS):
            _, name, group = KITS[i]
            if kit.get("name") != name:
                err(f"{kid}: name {kit.get('name')!r} != {name!r}")
            if kit.get("group") != group:
                err(f"{kid}: group {kit.get('group')!r} != {group!r}")
        if kit.get("title") != f"The AVES {kit.get('name')} Kit":
            err(f"{kid}: title {kit.get('title')!r} wrong")
        hz = kit.get("hazards", [])
        if not 3 <= len(hz) <= 5:
            err(f"{kid}: {len(hz)} hazards, need 3-5")
        for h in hz:
            if h != h.lower():
                err(f"{kid}: hazard not lower case: {h!r}")
        intro = kit.get("intro", "")
        if not intro or words(intro) > MAX_INTRO_WORDS:
            err(f"{kid}: intro is {words(intro)} words (max {MAX_INTRO_WORDS})")
        if "!" in intro:
            err(f"{kid}: intro has an exclamation mark")

        slots = kit.get("slots", [])
        keys = [s.get("slot") for s in slots]
        for k in keys:
            if k not in SLOT_ORDER:
                err(f"{kid}: unknown slot {k!r}")
        known = [k for k in keys if k in SLOT_ORDER]
        if known != sorted(known, key=SLOT_ORDER.index) or len(set(known)) != len(known):
            err(f"{kid}: slots not head-to-toe or duplicated: {keys}")
        missing = REQUIRED - set(keys)
        if missing:
            err(f"{kid}: missing required slots {sorted(missing)}")
        if "cryo-body" in keys and kid != "cryogenic":
            err(f"{kid}: cryo-body slot only allowed in cryogenic")

        for s in slots:
            sk = s.get("slot")
            where = f"{kid}/{sk}"
            if s.get("label") != LABELS.get(sk):
                err(f"{where}: label {s.get('label')!r} != {LABELS.get(sk)!r}")
            if s.get("confidence") not in CONFIDENCE:
                err(f"{where}: confidence {s.get('confidence')!r}")
            why = s.get("why", "")
            if not why or words(why) > MAX_WHY_WORDS:
                err(f"{where}: why is {words(why)} words (max {MAX_WHY_WORDS})")
            prim = s.get("primary")
            alts = s.get("alternates", [])
            if not 1 <= len(alts) <= 2:
                err(f"{where}: {len(alts)} alternates, need 1-2")
            if len(set(alts)) != len(alts) or prim in alts:
                err(f"{where}: alternates repeat or equal the primary")
            for pid in [prim] + list(alts):
                p = products.get(pid)
                if p is None:
                    err(f"{where}: unknown product id {pid!r}")
                    continue
                if p["category"] == BANNED_CATEGORY:
                    err(f"{where}: {pid} is Eyewash & Showers")
                if sk in CATEGORY and p["category"] not in CATEGORY[sk]:
                    err(f"{where}: {pid} is {p['category']}, not allowed in {sk}")
            if prim in products:
                pc = products[prim]["category"]
                for a in alts:
                    if a in products and products[a]["category"] != pc:
                        err(f"{where}: alternate {a} is {products[a]['category']}, primary is {pc}")
            if sk == "hand" and kid == "cryogenic" and products.get(prim, {}).get("category") != "Cryogenic":
                err(f"{where}: cryogenic hand slot must be a cryo glove")
            primary_uses[prim] += 1

    for pid, n in primary_uses.items():
        if n > MAX_PRIMARY_USES:
            err(f"variety: {pid} is primary in {n} kits (max {MAX_PRIMARY_USES})")

    if errors:
        print(f"FAIL: {len(errors)} problem(s) in data/kits.json")
        for e in errors:
            print("  -", e)
        return 1

    print(f"{'kit':<17} {'slots':>5} {'high':>5} {'med':>4} {'low':>4}  filled")
    tot = Counter()
    for kit in kits:
        c = Counter(s["confidence"] for s in kit["slots"])
        tot.update(c)
        print(f"{kit['id']:<17} {len(kit['slots']):>5} {c['high']:>5} {c['medium']:>4} {c['low']:>4}  "
              + ",".join(s["slot"] for s in kit["slots"]))
    print(f"{'total':<17} {sum(len(k['slots']) for k in kits):>5} {tot['high']:>5} {tot['medium']:>4} {tot['low']:>4}")
    print("most-used primaries:", ", ".join(f"{p} x{n}" for p, n in primary_uses.most_common(8)))
    print("OK: 18 kits valid")
    return 0


if __name__ == "__main__":
    sys.exit(main())
