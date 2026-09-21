#!/usr/bin/env python3
"""
BSData -> army-builder JSON

Parses a BattleScribe .cat catalogue from the BSData/wh40k-10e repo and emits
the slim JSON schema described in ARMY-BUILDER-PLAN.md.

Deliberately extracts POINTS AND OPTIONS ONLY - no rules/ability prose.
See the IP section of the plan for why.

Usage:
    python3 parse.py Orks.cat orks ../../assets/data/orks.json
"""

import json
import re
import sys
import xml.etree.ElementTree as ET
from collections import OrderedDict

PTS_TYPE_ID = '51b2-306e-1021-d207'

# Category names that map to a battlefield role. Order matters - first match wins.
ROLE_CATEGORIES = [
    'Epic Hero', 'Character', 'Battleline', 'Infantry', 'Mounted',
    'Vehicle', 'Monster', 'Beast', 'Swarm', 'Fortification',
    'Dedicated Transport', 'Aircraft',
]

# Categories that are keywords but never a "role"
SKIP_CATEGORY_PREFIXES = ('Faction:', 'Configuration', 'Detachment')


def tag(e):
    return e.tag.split('}')[-1]


def slug(s):
    s = re.sub(r'\[.*?\]', '', s)               # drop [Legends] etc
    s = re.sub(r'[^a-zA-Z0-9]+', '-', s.lower())
    return s.strip('-')


def children(e, name):
    """Direct children of e with the given local tag name."""
    return [c for c in e if tag(c) == name]


def first(e, name):
    c = children(e, name)
    return c[0] if c else None


def base_points(entry):
    """Top-level pts cost of a selection entry (0 if none)."""
    costs = first(entry, 'costs')
    if costs is None:
        return 0
    for c in children(costs, 'cost'):
        if c.get('typeId') == PTS_TYPE_ID or c.get('name') == 'pts':
            try:
                return int(float(c.get('value') or 0))
            except ValueError:
                return 0
    return 0


def points_brackets(entry, base):
    """
    Build model-count -> points brackets.

    BSData encodes these as `set` modifiers on the pts cost, conditioned on a
    model-count threshold, e.g. Boyz: base 80, `set 170` when models > 10.
    We turn that into [{count:10, pts:80}, {count:20, pts:170}].
    """
    thresholds = []
    for m in entry.iter():
        if tag(m) != 'modifier':
            continue
        if m.get('field') != PTS_TYPE_ID or m.get('type') != 'set':
            continue
        try:
            val = int(float(m.get('value') or 0))
        except ValueError:
            continue
        for c in m.iter():
            if tag(c) != 'condition':
                continue
            if c.get('field') != 'selections':
                continue
            try:
                thr = int(float(c.get('value') or 0))
            except ValueError:
                continue
            if c.get('type') in ('greaterThan', 'atLeast'):
                over = thr if c.get('type') == 'greaterThan' else thr - 1
                thresholds.append((over, val))

    lo, hi = model_count_range(entry)
    if not thresholds:
        return [{'count': lo or 1, 'pts': base}]

    thresholds.sort()
    brackets = [{'count': lo or 1, 'pts': base}]
    for over, val in thresholds:
        # the bracket starts at the first count above the threshold; in practice
        # 10th-ed units jump straight to their max size
        brackets.append({'count': hi if hi and hi > over else over + 1, 'pts': val})

    # de-dupe by count, keep the last (highest) price seen for that count
    out = OrderedDict()
    for b in brackets:
        out[b['count']] = b
    return list(out.values())


def model_count_range(entry):
    """
    (min, max) models in the unit.

    IMPORTANT: sum the *groups* that contain model entries, using each group's
    OWN direct constraints - not a recursive scan. Within a group the model
    entries are alternative loadouts (Boy w/ slugga OR Boy w/ shoota...), so
    summing their individual maxes massively overcounts. BSData names these
    groups after the real range, e.g. "9-19 Boyz" + "Boss Nob" = 10-20.
    """
    lo = hi = 0
    found = False

    groups = first(entry, 'selectionEntryGroups')
    if groups is not None:
        for grp in children(groups, 'selectionEntryGroup'):
            # does this group contain model entries?
            ses = first(grp, 'selectionEntries')
            has_models = ses is not None and any(
                se.get('type') == 'model' for se in children(ses, 'selectionEntry')
            )
            if not has_models:
                continue

            cons = first(grp, 'constraints')
            if cons is None:
                continue
            gmin = gmax = None
            for c in children(cons, 'constraint'):
                if c.get('field') != 'selections':
                    continue
                try:
                    v = int(float(c.get('value') or 0))
                except ValueError:
                    continue
                if c.get('type') == 'min':
                    gmin = v if gmin is None else max(gmin, v)
                elif c.get('type') == 'max' and v < 900:
                    gmax = v if gmax is None else max(gmax, v)
            if gmin is None and gmax is None:
                continue
            found = True
            lo += (gmin or 0)
            hi += (gmax if gmax is not None else (gmin or 0))

    if not found:
        # single-model datasheet (most Characters)
        return (1, 1)
    return (lo or 1, hi or lo or 1)


def rule_of_three(entry):
    """`max N selections scope=roster` is BSData's Rule of Three encoding."""
    cons = first(entry, 'constraints')
    if cons is None:
        return None
    for c in children(cons, 'constraint'):
        if (c.get('type') == 'max' and c.get('field') == 'selections'
                and c.get('scope') == 'roster'):
            try:
                return int(float(c.get('value') or 0))
            except ValueError:
                return None
    return None


def categories(entry):
    cats = []
    cl = first(entry, 'categoryLinks')
    if cl is None:
        return cats
    for c in children(cl, 'categoryLink'):
        n = c.get('name') or ''
        if not n or n.startswith(SKIP_CATEGORY_PREFIXES):
            continue
        cats.append(n)
    return cats


def role_of(cats):
    for r in ROLE_CATEGORIES:
        if r in cats:
            return r
    return 'Other'


def wargear(entry):
    """
    Upgrade options with a points delta or a selection limit.
    Names only - no rules text.
    """
    out = []
    seen = set()
    for grp in entry.iter():
        if tag(grp) != 'selectionEntryGroup':
            continue
        gname = grp.get('name') or ''
        if gname.lower() in ('crusade', 'enhancements'):
            continue
        ses = first(grp, 'selectionEntries')
        if ses is None:
            continue
        for se in children(ses, 'selectionEntry'):
            if se.get('type') not in ('upgrade',):
                continue
            nm = se.get('name') or ''
            key = slug(nm)
            if not nm or key in seen:
                continue
            seen.add(key)
            mx = None
            cons = first(se, 'constraints')
            if cons is not None:
                for c in children(cons, 'constraint'):
                    if c.get('type') == 'max' and c.get('field') == 'selections':
                        try:
                            mx = int(float(c.get('value') or 0))
                        except ValueError:
                            pass
            out.append({
                'id': key,
                'name': nm,
                'pts': base_points(se),
                'group': gname or None,
                'max': mx,
            })
    return out


def detachments(root):
    """
    Enhancements are nested one level down, in subgroups named
    "<Detachment> Enhancements". That nesting IS the detachment structure, so
    we emit detachments and their enhancements together.
    """
    out = []
    for top in root.iter():
        if tag(top) != 'selectionEntryGroup':
            continue
        if (top.get('name') or '').strip().lower() != 'enhancements':
            continue

        subs = first(top, 'selectionEntryGroups')
        if subs is None:
            continue

        for sub in children(subs, 'selectionEntryGroup'):
            gname = (sub.get('name') or '').strip()
            if not gname:
                continue
            dname = re.sub(r'\s*Enhancements$', '', gname).strip()

            ses = first(sub, 'selectionEntries')
            if ses is None:
                continue

            enh = []
            for se in children(ses, 'selectionEntry'):
                nm = (se.get('name') or '').strip()
                if not nm:
                    continue
                pts = base_points(se)
                if pts <= 0:
                    # Boarding Actions / narrative-only entries carry no cost;
                    # skip them rather than emitting misleading 0pt options.
                    continue
                enh.append({'id': slug(nm), 'name': nm, 'pts': pts})

            if enh:
                out.append({
                    'id': slug(dname),
                    'name': dname,
                    'enhancements': enh,
                })

    dd = OrderedDict((d['id'], d) for d in out)
    return list(dd.values())


def is_legends(name):
    return '[Legends]' in name or 'Legends' in name


def parse(path, faction_id):
    tree = ET.parse(path)
    root = tree.getroot()

    cat_name = root.get('name') or faction_id
    revision = root.get('revision') or '?'

    ses = None
    for c in root:
        if tag(c) == 'sharedSelectionEntries':
            ses = c
            break
    if ses is None:
        raise SystemExit('No sharedSelectionEntries found')

    datasheets = []
    for e in children(ses, 'selectionEntry'):
        if e.get('type') not in ('model', 'unit'):
            continue
        name = e.get('name') or ''
        if not name:
            continue

        cats = categories(e)
        role = role_of(cats)
        base = base_points(e)
        lo, hi = model_count_range(e)

        ds = {
            'id': slug(name),
            'name': re.sub(r'\s*\[Legends\]\s*', '', name).strip(),
            'role': role,
            'keywords': cats,
            'epicHero': 'Epic Hero' in cats,
            'legends': is_legends(name),
            'maxPerArmy': rule_of_three(e),
            'models': points_brackets(e, base),
            'minModels': lo,
            'maxModels': hi,
            'wargear': wargear(e),
        }
        datasheets.append(ds)

    datasheets.sort(key=lambda d: (d['role'], d['name']))

    return {
        'id': faction_id,
        'name': cat_name.replace('Xenos - ', '').replace('Imperium - ', '')
                        .replace('Chaos - ', ''),
        'source': 'BSData/wh40k-10e',
        'revision': revision,
        'enhancements': enhancements(root),
        'datasheets': datasheets,
    }


def main():
    if len(sys.argv) < 4:
        print(__doc__)
        raise SystemExit(1)
    src, fid, dest = sys.argv[1], sys.argv[2], sys.argv[3]
    data = parse(src, fid)
    with open(dest, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=1, ensure_ascii=False)

    ds = data['datasheets']
    print(f"{data['name']}: {len(ds)} datasheets, "
          f"{len(data['enhancements'])} enhancements "
          f"(rev {data['revision']}) -> {dest}")
    roles = {}
    for d in ds:
        roles[d['role']] = roles.get(d['role'], 0) + 1
    for r, n in sorted(roles.items(), key=lambda x: -x[1]):
        print(f"   {r:22} {n}")


if __name__ == '__main__':
    main()
