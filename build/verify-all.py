#!/usr/bin/env python3
"""
verify-all.py — cross-faction regression test for the BSData parser.

Where verify-orks.py checks Orks against hand-verified codex points, this
checks the *structural* health of every parsed faction — the kind of bug
that isn't "a number is wrong" but "an entire other codex leaked in", which
is exactly what happened during Phase 6 development (a variable-shadowing
bug caused Chaos Knights to include the full Chaos Space Marines troop
roster). That specific case is now a permanent regression check below.

Run after every parser change or BSData refresh:
    python3 build/verify-all.py
"""

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'assets', 'data')

# Names that must NEVER appear in these factions' datasheets. Each of these
# belongs to a specific other codex; seeing one here means a cross-faction
# leak has reappeared (see the "variable shadowing" bug in §14 of
# ARMY-BUILDER-PLAN.md).
FORBIDDEN = {
    'chaos-knights': [
        'Plague Marines', 'Rubric Marines', 'Noise Marines',
        'Khorne Berzerkers', 'Chaos Terminator Squad', 'Legionaries',
    ],
    'orks': ['Boyz [Legends]', 'Space Marine', 'Necron Warriors'],
    'space-wolves': [
        'Ork', 'Necron', 'Tyranid', 'Eldar', 'Custodes', 'Guardsman',
    ],
    'death-guard': ['Boyz', 'Necron Warriors', 'Intercessor Squad'],
    'tyranids': ['Space Marine', 'Ork', 'Necron', 'Chaos'],
    'adeptus-custodes': ['Boyz', 'Necron Warriors', 'Tyranid'],
}

MIN_DATASHEETS = {
    'orks': 50, 'chaos-knights': 15, 'space-wolves': 40,
    'death-guard': 30, 'tyranids': 30, 'adeptus-custodes': 30,
}
MIN_DETACHMENTS = 3   # every 10th-ed faction has several


def check_faction(fid):
    path = os.path.join(DATA, f'{fid}.json')
    if not os.path.exists(path):
        return [f'{fid}: no data file found — was it parsed?']

    d = json.load(open(path, encoding='utf-8'))
    names = [s['name'] for s in d['datasheets']]
    issues = []

    minsheets = MIN_DATASHEETS.get(fid, 10)
    if len(names) < minsheets:
        issues.append(f'{fid}: only {len(names)} datasheets (expected >= {minsheets})')

    if len(d['detachments']) < MIN_DETACHMENTS:
        issues.append(f'{fid}: only {len(d["detachments"])} detachments '
                      f'(expected >= {MIN_DETACHMENTS})')

    for forbidden_name in FORBIDDEN.get(fid, []):
        matches = [n for n in names if forbidden_name in n]
        if matches:
            issues.append(f'{fid}: FORBIDDEN cross-faction leak: {matches} '
                          f'(contains "{forbidden_name}")')

    zero = [n for n, s in zip(names, d['datasheets'])
            if s['unitSizes'] and s['unitSizes'][0]['pts'] == 0]
    if zero:
        issues.append(f'{fid}: {len(zero)} unit(s) at 0 pts: {zero[:5]}')

    dupes = [n for n in set(names) if names.count(n) > 1]
    if dupes:
        issues.append(f'{fid}: duplicate datasheet names: {dupes}')

    return issues


def main():
    factions = list(MIN_DATASHEETS.keys())
    all_issues = []
    for fid in factions:
        issues = check_faction(fid)
        if issues:
            all_issues.extend(issues)
        else:
            d = json.load(open(os.path.join(DATA, f'{fid}.json'), encoding='utf-8'))
            print(f'  ✓ {d["name"]:<20} {len(d["datasheets"]):>3} datasheets, '
                  f'{len(d["detachments"]):>2} detachments')

    if all_issues:
        print(f'\nFAILED — {len(all_issues)} problem(s):\n')
        for i in all_issues:
            print('  ✗', i)
        return 1

    print(f'\nPASSED — {len(factions)} factions clean')
    return 0


if __name__ == '__main__':
    sys.exit(main())
