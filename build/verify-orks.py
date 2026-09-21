#!/usr/bin/env python3
"""
verify-orks.py — regression check for the BSData parser.

Compares parsed output against points values hand-checked from the current
Orks codex/dataslate. Run this after every BSData refresh: if BSData changes
shape (it does, periodically), this is what tells you the parser broke.

    python3 build/verify-orks.py

Exits non-zero on any mismatch so it can gate a commit.
"""

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'assets', 'data', 'orks.json')

# (models, points) brackets, hand-verified against the codex.
EXPECTED_SIZES = {
    'Boyz':        [(10, 80), (20, 170)],
    'Nobz':        [(5, 105), (10, 210)],
    'Stormboyz':   [(5, 65), (10, 130)],
    'Killa Kans':  [(3, 125), (6, 250)],
    'Battlewagon': [(1, 160)],
    'Warboss':     [(1, 75)],
    'Beastboss':   [(1, 80)],
    'Deff Dread':  [(1, 120)],
}

EXPECTED_KEYWORDS = {
    'Boyz':      {'BATTLELINE', 'INFANTRY'},
    'Warboss':   {'CHARACTER', 'INFANTRY'},
    'Battlewagon': {'VEHICLE', 'TRANSPORT'},
}

# Battleline units may be taken 6 times; everything else 3 (Rule of Three).
EXPECTED_ROSTER_MAX = {
    'Boyz': 6,
    'Nobz': 3,
    'Warboss': 3,
}

MIN_DATASHEETS = 50
MIN_DETACHMENTS = 10


def main():
    if not os.path.exists(DATA):
        print(f'FAIL: {DATA} not found — run parse-bsdata.py first')
        return 1

    data = json.load(open(DATA, encoding='utf-8'))
    sheets = {d['name']: d for d in data['datasheets']}
    failures = []

    # --- structural sanity ---
    if len(data['datasheets']) < MIN_DATASHEETS:
        failures.append(f"only {len(data['datasheets'])} datasheets "
                        f"(expected >= {MIN_DATASHEETS})")
    if len(data['detachments']) < MIN_DETACHMENTS:
        failures.append(f"only {len(data['detachments'])} detachments "
                        f"(expected >= {MIN_DETACHMENTS})")

    # --- points brackets ---
    for name, expected in EXPECTED_SIZES.items():
        if name not in sheets:
            failures.append(f'{name}: missing from output')
            continue
        got = [(b['models'], b['pts']) for b in sheets[name]['unitSizes']]
        if got != expected:
            failures.append(f'{name}: sizes {got} != expected {expected}')

    # --- keywords ---
    for name, expected in EXPECTED_KEYWORDS.items():
        if name not in sheets:
            continue
        got = set(sheets[name]['keywords'])
        missing = expected - got
        if missing:
            failures.append(f'{name}: missing keywords {sorted(missing)}')

    # --- roster limits ---
    for name, expected in EXPECTED_ROSTER_MAX.items():
        if name not in sheets:
            continue
        got = sheets[name].get('rosterMax')
        if got != expected:
            failures.append(f'{name}: rosterMax {got} != expected {expected}')

    # --- every detachment should carry enhancements ---
    empty = [d['name'] for d in data['detachments'] if not d.get('enhancements')]
    if empty:
        failures.append(f'detachments with no enhancements: {empty}')

    # --- no zero-point units (a classic sign of a parse failure) ---
    zero = [d['name'] for d in data['datasheets']
            if d['unitSizes'] and d['unitSizes'][0]['pts'] == 0]
    if zero:
        failures.append(f'{len(zero)} unit(s) parsed at 0 pts: {zero[:5]}')

    if failures:
        print(f'FAILED — {len(failures)} problem(s):\n')
        for f in failures:
            print('  ✗', f)
        return 1

    print('PASSED')
    print(f"  {len(data['datasheets'])} datasheets, "
          f"{len(data['detachments'])} detachments")
    print(f"  {len(EXPECTED_SIZES)} points brackets verified against codex")
    print(f"  data generated {data.get('generated')}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
