#!/usr/bin/env python3
"""
parse-bsdata.py — converts BSData BattleScribe catalogues into the slim JSON
the EC Warlords army builder consumes.

Usage:
    python3 build/parse-bsdata.py --fetch                 # download BSData, parse default factions
    python3 build/parse-bsdata.py --faction Orks          # parse one faction
    python3 build/parse-bsdata.py --all                   # parse every faction

Deliberately extracts ONLY points, names, keywords and option structure.
No rules prose, no weapon stat lines — see ARMY-BUILDER-PLAN.md section 3
for the IP reasoning.
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import xml.etree.ElementTree as ET
from datetime import date

NS = {'bs': 'http://www.battlescribe.net/schema/catalogueSchema'}
BSDATA_ZIP = "https://codeload.github.com/BSData/wh40k-10e/zip/refs/heads/main"

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'build', '.bsdata')
OUT   = os.path.join(ROOT, 'assets', 'data')

# Keywords we keep for validation purposes. Everything else is noise for a
# points calculator.
KEEP_KEYWORDS = {
    'INFANTRY', 'BATTLELINE', 'CHARACTER', 'EPIC HERO', 'VEHICLE', 'MONSTER',
    'DEDICATED TRANSPORT', 'WALKER', 'BEAST', 'CAVALRY', 'AIRCRAFT', 'PSYKER',
    'FORTIFICATION', 'TITANIC', 'IMPERIUM', 'CHAOS', 'GRENADES', 'TRANSPORT',
}


NON_DATASHEET_ENTRIES = {
    'detachment', 'enhancements', 'warlord', 'crusade',
    'army of renown', 'battle size', 'show/hide options',
}

def tg(el):
    """Local tag name without the namespace."""
    return el.tag.split('}')[1]


def slug(text):
    s = re.sub(r'\[.*?\]', '', text or '').strip().lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')


def fetch_bsdata():
    """Download and extract the BSData repo into build/.bsdata."""
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    zip_path = os.path.join(os.path.dirname(CACHE), 'wh40k-10e.zip')
    print('Downloading BSData…')
    subprocess.run(['curl', '-sSL', '-o', zip_path, BSDATA_ZIP], check=True)
    if os.path.isdir(CACHE):
        shutil.rmtree(CACHE)
    tmp = os.path.join(os.path.dirname(CACHE), '_extract')
    if os.path.isdir(tmp):
        shutil.rmtree(tmp)
    subprocess.run(['unzip', '-q', zip_path, '-d', tmp], check=True)
    inner = os.path.join(tmp, 'wh40k-10e-main')
    shutil.move(inner, CACHE)
    shutil.rmtree(tmp, ignore_errors=True)
    os.remove(zip_path)
    print(f'BSData extracted to {CACHE}')


def pts_of(entry):
    """Base points cost of a selection entry (0 if none)."""
    costs = entry.find('bs:costs', NS)
    if costs is None:
        return 0, None
    for c in costs:
        if c.get('name') == 'pts':
            return int(float(c.get('value') or 0)), c.get('typeId')
    return 0, None


def size_brackets(entry, pts_type_id):
    """
    BSData encodes unit-size pricing two different ways, and both appear in
    the same catalogue:

      Pattern A ("Boyz"):    separate model groups with min/max constraints
                             e.g. "9-19 Boyz" + "Boss Nob" -> sizes 10 and 20
      Pattern B ("Gretchin"): a single "Unit Composition" group whose entries
                             ARE the sizes, with counts written into the name
                             e.g. "1 Runtherd and 10 Gretchin"

    In both cases the higher price comes from a conditional 'set' modifier on
    the points field. We reconstruct discrete brackets from whichever pattern
    is present.
    """
    base, _ = pts_of(entry)
    groups = entry.find('bs:selectionEntryGroups', NS)

    sizes = []          # candidate model counts, ascending
    if groups is not None:
        # --- Pattern B: a composition group listing the sizes explicitly ---
        for g in groups:
            gname = (g.get('name') or '').lower()
            if 'composition' not in gname:
                continue
            ses = g.find('bs:selectionEntries', NS)
            if ses is None:
                continue
            for s in ses:
                # Sum every number in the name: "2 Runtherds and 20 Gretchin" -> 22
                nums = [int(n) for n in re.findall(r'\d+', s.get('name') or '')]
                if nums:
                    sizes.append(sum(nums))
            if sizes:
                break

        # --- Pattern A: sum the min (and max) across body model groups ---
        if not sizes:
            min_total, max_total, found = 0, 0, False
            for g in groups:
                ses = g.find('bs:selectionEntries', NS)
                if ses is None:
                    continue
                # Only groups made of actual models count toward unit size.
                # Upgrade groups (e.g. Ork "Ammo Runts") must be excluded or
                # they inflate every bracket by one.
                if not any(s.get('type') == 'model' for s in ses):
                    continue
                gmin, gmax = None, None
                cons = g.find('bs:constraints', NS)
                if cons is not None:
                    for c in cons:
                        if c.get('field') != 'selections':
                            continue
                        v = int(float(c.get('value') or 0))
                        if c.get('type') == 'min':
                            gmin = v
                        elif c.get('type') == 'max':
                            gmax = v
                # A model group with no constraints is a single mandatory
                # model (the Boss Nob pattern), so it counts as exactly 1.
                if gmin is None and gmax is None:
                    gmin = gmax = 1
                else:
                    gmin = gmin if gmin is not None else 0
                    gmax = gmax if gmax is not None else gmin
                min_total += gmin
                max_total += gmax
                found = True
            if found and min_total > 0:
                sizes.append(min_total)
                if max_total > min_total:
                    sizes.append(max_total)

    if not sizes:
        sizes = [1]
    sizes = sorted(set(sizes))

    # Pattern C ("Mek Gunz"): the parent carries no cost at all and each model
    # entry is individually priced. Price the brackets per model instead.
    if base == 0 and groups is not None:
        per_model = 0
        for g in groups:
            ses = g.find('bs:selectionEntries', NS)
            if ses is None:
                continue
            for s in ses:
                if s.get('type') != 'model':
                    continue
                p, _ = pts_of(s)
                if p > 0:
                    per_model = max(per_model, p)
        if per_model:
            return [{'models': n, 'pts': per_model * n} for n in sizes]

    # Conditional cost modifiers give the price of the larger bracket(s)
    upgrade_costs = []
    mods = entry.find('bs:modifiers', NS)
    if mods is not None and pts_type_id:
        for m in mods:
            if m.get('type') != 'set' or m.get('field') != pts_type_id:
                continue
            val = int(float(m.get('value') or 0))
            is_size_cond = False
            for conds in m:
                for cond in conds:
                    if cond.get('field') == 'selections':
                        is_size_cond = True
            if is_size_cond:
                upgrade_costs.append(val)
    upgrade_costs = sorted(set(upgrade_costs))

    brackets = []
    for i, n in enumerate(sizes):
        if i == 0:
            pts = base
        elif i - 1 < len(upgrade_costs):
            pts = upgrade_costs[i - 1]
        else:
            # No explicit modifier: scale linearly from the base bracket
            pts = int(round(base * n / sizes[0])) if sizes[0] else base
        brackets.append({'models': n, 'pts': pts})
    return brackets


def keywords_of(entry):
    out = []
    cl = entry.find('bs:categoryLinks', NS)
    if cl is None:
        return out
    for c in cl:
        name = (c.get('name') or '').strip()
        if not name or name.startswith('Faction:'):
            continue
        up = name.upper()
        if up in KEEP_KEYWORDS:
            out.append(up)
    return sorted(set(out))


def roster_max(entry):
    """Max copies allowed in a roster (Rule of Three / Battleline 6)."""
    cons = entry.find('bs:constraints', NS)
    if cons is None:
        return None
    for c in cons:
        if (c.get('type') == 'max' and c.get('field') == 'selections'
                and c.get('scope') == 'roster'):
            return int(float(c.get('value') or 0))
    return None


def option_groups(entry):
    """
    Loadout options for a datasheet, preserved as groups so the UI can render
    "pick one of these" properly.

    Note on 10th edition: almost all wargear is FREE — points are baked into
    the datasheet cost, and only unit size changes the total. So these entries
    mostly exist so a player can record and print their actual loadout, not
    because they move the points needle. Enhancements are the thing that
    genuinely costs points.

    Weapon swaps are encoded as type="model" entries at 0 pts (e.g. "Boy w/
    Big shoota"), so we must NOT filter those out — that was the bug that made
    Boyz look like it had no options at all.
    """
    out = []
    groups = entry.find('bs:selectionEntryGroups', NS)
    if groups is None:
        return out

    SKIP = ('crusade', 'codex crusade relics', 'unit composition',
            'battle traits', 'specialisms', 'enhancement upgrades')

    def group_limit(g):
        cons = g.find('bs:constraints', NS)
        if cons is None:
            return None
        for c in cons:
            if (c.get('type') == 'max' and c.get('field') == 'selections'):
                return int(float(c.get('value') or 0))
        return None

    def scan(g, depth=0, path=''):
        gname = (g.get('name') or '').strip()
        if gname.lower() in SKIP or depth > 3:
            return
        label = (path + ' · ' + gname).strip(' ·') if path else gname

        choices = []
        ses = g.find('bs:selectionEntries', NS)
        if ses is not None:
            for s in ses:
                nm = (s.get('name') or '').strip()
                if not nm:
                    continue
                p, _ = pts_of(s)
                choices.append({'id': slug(nm), 'name': nm, 'pts': p})

        if choices:
            out.append({
                'id': slug(label) or 'options',
                'name': label,
                'max': group_limit(g),
                'choices': choices,
            })

        sub = g.find('bs:selectionEntryGroups', NS)
        if sub is not None:
            for sg in sub:
                scan(sg, depth + 1, label)

    for g in groups:
        scan(g)
    return out


def parse_enhancements(root):
    """Enhancements, grouped per detachment."""
    by_detachment = {}
    sgs = root.find('bs:sharedSelectionEntryGroups', NS)
    if sgs is None:
        return by_detachment
    for sg in sgs:
        if sg.get('name') != 'Enhancements':
            continue
        subs = sg.find('bs:selectionEntryGroups', NS)
        if subs is None:
            continue
        for sub in subs:
            det_name = re.sub(r'\s+Enhancements$', '', sub.get('name') or '')
            items = []
            ses = sub.find('bs:selectionEntries', NS)
            if ses is not None:
                for s in ses:
                    p, _ = pts_of(s)
                    items.append({
                        'id': slug(s.get('name')),
                        'name': s.get('name'),
                        'pts': p,
                    })
            if items:
                by_detachment[slug(det_name)] = {
                    'name': det_name,
                    'enhancements': items,
                }
    return by_detachment


def parse_detachments(root):
    out = []
    sgs = root.find('bs:sharedSelectionEntryGroups', NS)
    if sgs is None:
        return out
    for sg in sgs:
        if sg.get('name') != 'Detachment':
            continue
        ses = sg.find('bs:selectionEntries', NS)
        if ses is None:
            continue
        for s in ses:
            out.append({'id': slug(s.get('name')), 'name': s.get('name')})
    return out


def parse_catalogue(path, include_legends=False):
    root = ET.parse(path).getroot()
    cat_name = root.get('name') or os.path.basename(path)
    faction_name = cat_name.split(' - ')[-1]

    shared = root.find('bs:sharedSelectionEntries', NS)
    by_id = {s.get('id'): s for s in shared} if shared is not None else {}

    # entryLinks at catalogue level are the top-level "takeable" datasheets
    datasheets = []
    links = root.find('bs:entryLinks', NS)
    seen = set()
    if links is not None:
        for link in links:
            target = by_id.get(link.get('targetId'))
            if target is None:
                continue
            name = link.get('name') or target.get('name') or ''
            if not include_legends and '[Legends]' in name:
                continue
            # Structural entries that aren't datasheets
            if name.strip().lower() in NON_DATASHEET_ENTRIES:
                continue
            sid = slug(name)
            if not sid or sid in seen:
                continue
            seen.add(sid)

            base, pts_type = pts_of(target)
            sizes = size_brackets(target, pts_type)
            # A real datasheet always costs something; anything still at zero
            # is a parse failure or a non-unit entry, so leave it out rather
            # than silently offering a free unit in the builder.
            if not sizes or sizes[0]['pts'] <= 0:
                continue

            datasheets.append({
                'id': sid,
                'name': re.sub(r'\s*\[Legends\]', '', name).strip(),
                'legends': '[Legends]' in name,
                'keywords': keywords_of(target),
                'unitSizes': sizes,
                'options': option_groups(target),
                'rosterMax': roster_max(target),
            })

    detachments = parse_detachments(root)
    enh_map = parse_enhancements(root)
    for d in detachments:
        match = enh_map.get(d['id'])
        d['enhancements'] = match['enhancements'] if match else []

    return {
        'id': slug(faction_name),
        'name': faction_name,
        'source': 'BSData wh40k-10e',
        'generated': date.today().isoformat(),
        'detachments': detachments,
        'datasheets': sorted(datasheets, key=lambda d: d['name']),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--fetch', action='store_true', help='download BSData first')
    ap.add_argument('--faction', action='append', help='faction .cat basename, e.g. Orks')
    ap.add_argument('--all', action='store_true', help='parse every catalogue')
    ap.add_argument('--legends', action='store_true', help='include Legends units')
    args = ap.parse_args()

    if args.fetch or not os.path.isdir(CACHE):
        fetch_bsdata()

    os.makedirs(OUT, exist_ok=True)

    if args.all:
        targets = [f for f in os.listdir(CACHE)
                   if f.endswith('.cat') and 'Library' not in f]
    elif args.faction:
        targets = []
        for f in args.faction:
            cands = [c for c in os.listdir(CACHE)
                     if c.endswith('.cat') and f.lower() in c.lower()]
            if not cands:
                print(f'  ! no catalogue matching "{f}"')
            targets.extend(cands)
    else:
        targets = ['Orks.cat']

    index = []
    for t in sorted(set(targets)):
        path = os.path.join(CACHE, t)
        try:
            data = parse_catalogue(path, include_legends=args.legends)
        except Exception as e:
            print(f'  ! failed {t}: {e}')
            continue
        fname = f"{data['id']}.json"
        with open(os.path.join(OUT, fname), 'w', encoding='utf-8') as fh:
            json.dump(data, fh, indent=1, ensure_ascii=False)
        index.append({'id': data['id'], 'name': data['name'], 'file': fname,
                      'datasheets': len(data['datasheets'])})
        print(f"  ✓ {data['name']}: {len(data['datasheets'])} datasheets, "
              f"{len(data['detachments'])} detachments → {fname}")

    # Merge into the faction index rather than clobbering other runs
    idx_path = os.path.join(OUT, 'factions.json')
    existing = []
    if os.path.exists(idx_path):
        try:
            existing = json.load(open(idx_path, encoding='utf-8')).get('factions', [])
        except Exception:
            existing = []
    merged = {f['id']: f for f in existing}
    for f in index:
        merged[f['id']] = f
    with open(idx_path, 'w', encoding='utf-8') as fh:
        json.dump({
            'generated': date.today().isoformat(),
            'source': 'BSData wh40k-10e (https://github.com/BSData/wh40k-10e)',
            'factions': sorted(merged.values(), key=lambda x: x['name']),
        }, fh, indent=1, ensure_ascii=False)
    print(f"\nIndex written: {len(merged)} faction(s) in factions.json")


if __name__ == '__main__':
    main()
