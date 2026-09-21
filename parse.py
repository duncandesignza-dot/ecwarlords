#!/usr/bin/env python3
"""
BSData -> army-builder / datasheet-lookup JSON

Parses a BattleScribe .cat catalogue from the BSData/wh40k-10e repo and emits
the slim JSON schema described in ARMY-BUILDER-PLAN.md, extended (as of the
Datasheet Lookup work) to also emit numeric stat blocks and weapon profiles.

IP POSTURE - read before touching the stats/weapons/abilities extraction
below. This parser pulls:
  - numeric stats (M/T/SV/W/LD/OC) and weapon profiles (Range/A/BS-WS/S/AP/D
    plus the weapon's own Keywords characteristic, e.g. "Pistol", "Blast") -
    bare numbers and short mechanical tags, not GW's expressive rules text.
  - ability and named-rule LABELS ONLY (e.g. "Waaagh!", "Invulnerable Save
    (5+)") - never the "Description" characteristic that holds the actual
    rules prose. That field is deliberately never read by this file.
Points and wargear options are still extracted the same way they always
were. Adding a new extractor? Ask: "does this read a Description
characteristic, or an infoLink's linked rule body?" If yes, stop - that's
the line this file exists to hold.

Usage:
    python3 parse.py Orks.cat orks ../../assets/data/orks.json

    # Factions with no datasheets of their own (Craftworlds, Drukhari,
    # Ynnari, Astra Militarum, Chaos Daemons, Chaos Knights, Imperial
    # Knights) are built entirely from a shared BSData "Library" catalogue -
    # pass the library file(s) too, main faction file first:
    python3 parse.py "Aeldari - Craftworlds.cat" "Aeldari - Aeldari Library.cat" \\
        craftworlds ../../assets/data/craftworlds.json
"""

import json
import re
import sys
import xml.etree.ElementTree as ET
from collections import OrderedDict

PTS_TYPE_ID = '51b2-306e-1021-d207'

# Shared profile/characteristic type ids, from the Warhammer 40,000.gst game
# system file - constant across every faction .cat in the BSData repo.
UNIT_TYPE_ID = 'c547-1836-d8a-ff4f'          # profileType "Unit" -> M/T/SV/W/LD/OC
RANGED_TYPE_ID = 'f77d-b953-8fa4-b762'       # profileType "Ranged Weapons"
MELEE_TYPE_ID = '8a40-4aaa-c780-9046'        # profileType "Melee Weapons"
ABILITIES_TYPE_ID = '9cc3-6d83-4dd3-9b64'    # profileType "Abilities" (name only)

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


def build_index(root):
    """id -> element, for resolving entryLink/infoLink targetIds anywhere
    in the document (weapon and rule entries live all over a .cat file:
    top-level shared entries, or nested inline under a specific unit)."""
    idx = {}
    for e in root.iter():
        eid = e.get('id')
        if eid:
            idx[eid] = e
    return idx


def char_map(profile):
    """{characteristic name: value text} for one <profile>."""
    chars = first(profile, 'characteristics')
    out = OrderedDict()
    if chars is None:
        return out
    for c in children(chars, 'characteristic'):
        out[c.get('name')] = (c.text or '').strip()
    return out


def reachable_nodes(entry, index):
    """
    entry, plus every node reachable by following entryLink(type=
    selectionEntry) targets - possibly several hops (a squad's "1 Runtherd
    and 10 Gretchin" wrapper links to a "Gretchin" model entry, which is
    where its actual stat/weapon profiles live). Cycle-safe via a visited
    set of resolved target ids.
    """
    seen_targets = set()
    nodes = [entry]

    def walk(node):
        for link in node.iter():
            if tag(link) != 'entryLink' or link.get('type') != 'selectionEntry':
                continue
            tid = link.get('targetId')
            if not tid or tid in seen_targets:
                continue
            seen_targets.add(tid)
            tgt = index.get(tid)
            if tgt is not None:
                nodes.append(tgt)
                walk(tgt)

    walk(entry)
    return nodes


def datasheet_stats(entry, index):
    """
    Every distinct Unit-type stat block reachable under entry (inline, or
    one/several entryLink hops away - see reachable_nodes), deduped by
    profile name. A squad datasheet can carry more than one (e.g. Boyz has
    a "Boy" block and a "Boss Nob" block) - each becomes its own row.
    """
    out = OrderedDict()
    for node in reachable_nodes(entry, index):
        for p in node.iter():
            if tag(p) == 'profile' and p.get('typeId') == UNIT_TYPE_ID:
                nm = p.get('name') or ''
                if nm and nm not in out:
                    out[nm] = char_map(p)
    return [{'name': nm, 'stats': st} for nm, st in out.items()]


def collect_weapons(entry, index, pool):
    """
    Ranged/melee weapon profiles reachable under entry (inline, or via
    entryLink hops - weapons are usually linked in from elsewhere in the
    .cat, not embedded). Dedupes into a shared faction-level `pool` keyed by
    (type, name, stat signature) so identical weapons reused across many
    datasheets (Choppa, Slugga...) are stored once; a same-named weapon with
    different stats on a different datasheet (a Warboss's Big Choppa hits
    harder than a Boyz Boss Nob's) gets its own pool entry and id.
    Returns the list of weapon ids used by this datasheet.
    """
    ids = []
    seen_local = set()

    def add_profile(p):
        wtype = 'ranged' if p.get('typeId') == RANGED_TYPE_ID else 'melee'
        nm = p.get('name') or ''
        if not nm:
            return
        chars = char_map(p)
        key = (wtype, nm, tuple(sorted(chars.items())))
        if key in seen_local:
            return
        seen_local.add(key)
        if key not in pool:
            base_id = slug(nm)
            variant = sum(1 for k in pool if k[1] == nm) + 1
            wid = base_id if variant == 1 else f'{base_id}-{variant}'
            pool[key] = {'id': wid, 'name': nm, 'type': wtype, 'stats': chars}
        ids.append(pool[key]['id'])

    for node in reachable_nodes(entry, index):
        for p in node.iter():
            if tag(p) == 'profile' and p.get('typeId') in (RANGED_TYPE_ID, MELEE_TYPE_ID):
                add_profile(p)

    out = []
    for i in ids:
        if i not in out:
            out.append(i)
    return out


def _is_weapon_entry(se):
    profiles = first(se, 'profiles')
    if profiles is None:
        return False
    return any(p.get('typeId') in (RANGED_TYPE_ID, MELEE_TYPE_ID)
               for p in children(profiles, 'profile'))


def datasheet_abilities(entry):
    """
    Ability and named-rule LABELS only - e.g. "Waaagh!", "Deadly Demise",
    "Invulnerable Save (5+)". Never reads a profile's Description
    characteristic (the actual rules text) or follows an infoLink to its
    target's body. See the IP notice at the top of this file.

    Deliberately does NOT follow entryLink hops the way stats/weapons do:
    unit-level abilities are consistently inline on the top-level entry.
    It also stops descending once it enters a weapon-bearing selectionEntry
    nested directly inside (e.g. an inline wargear option like "Kombi-
    weapon"), so that weapon-level rule tags (Pistol, Twin-linked...) don't
    get swept in as unit abilities - those already surface via each
    weapon's own Keywords characteristic instead.
    """
    out = []
    seen = set()

    def add(nm):
        if nm and nm not in seen:
            seen.add(nm)
            out.append(nm)

    def walk(node):
        if tag(node) == 'selectionEntry' and _is_weapon_entry(node):
            return  # weapon subtree - skip its infoLinks/abilities entirely
        if tag(node) == 'profile' and node.get('typeId') == ABILITIES_TYPE_ID:
            add(node.get('name') or '')
        if tag(node) == 'infoLink' and node.get('type') in ('rule', 'profile'):
            add(node.get('name') or '')
        for ch in node:
            walk(ch)

    walk(entry)
    return out


def gather_datasheet_entries(main_root, index):
    """
    (name, entry) pairs to treat as datasheets for this faction.

    Most factions (Orks, Necrons...) embed their own datasheets directly in
    a <sharedSelectionEntries> block - use those.

    Some factions (Craftworlds, Drukhari, Ynnari, Astra Militarum, Chaos
    Daemons, Chaos Knights, Imperial Knights) carry no datasheets of their
    own at all: they're built entirely from a shared BSData "Library"
    catalogue (e.g. "Aeldari - Aeldari Library.cat" backs Craftworlds,
    Drukhari AND Ynnari), and the faction .cat file is just a curated list
    of top-level <entryLinks> pointing into that library by id. In that
    case, resolve each entryLink against `index` (which must include the
    library file(s), built by the caller) and use the resolved target as
    the effective datasheet entry, but keep the entryLink's own name (the
    library target's name should match, but the link is authoritative for
    what this faction calls the unit, e.g. Legends suffixes).
    """
    for c in main_root:
        if tag(c) == 'sharedSelectionEntries':
            out = []
            for e in children(c, 'selectionEntry'):
                if e.get('type') in ('model', 'unit'):
                    name = e.get('name') or ''
                    if name:
                        out.append((name, e))
            if out:
                return out

    out = []
    for c in main_root:
        if tag(c) != 'entryLinks':
            continue
        for link in children(c, 'entryLink'):
            if link.get('type') != 'selectionEntry':
                continue
            tgt = index.get(link.get('targetId'))
            if tgt is None or tag(tgt) != 'selectionEntry':
                continue
            if tgt.get('type') not in ('model', 'unit'):
                continue
            name = link.get('name') or tgt.get('name') or ''
            if name:
                out.append((name, tgt))
    return out


def parse(paths, faction_id):
    """
    paths: the faction's own .cat file, optionally followed by any BSData
    "Library" catalogue .cat files it depends on (see gather_datasheet_
    entries above - a faction's own <catalogueLinks> names which libraries
    it needs; resolving that to actual filenames and downloading them is
    the caller's job, not this function's - this stays a pure offline
    parser over whatever local files it's handed).
    """
    if isinstance(paths, str):
        paths = [paths]
    roots = [ET.parse(p).getroot() for p in paths]
    main_root = roots[0]

    index = {}
    for r in roots:
        index.update(build_index(r))

    cat_name = main_root.get('name') or faction_id
    revision = main_root.get('revision') or '?'

    entries = gather_datasheet_entries(main_root, index)
    if not entries:
        raise SystemExit(
            'No datasheets found - checked sharedSelectionEntries and '
            'top-level entryLinks (missing a library .cat on the command '
            'line? check this faction\'s <catalogueLinks>)')

    weapon_pool = OrderedDict()
    datasheets = []
    seen_ids = set()
    for name, e in entries:
        did = slug(name)
        if did in seen_ids:
            continue
        seen_ids.add(did)

        cats = categories(e)
        role = role_of(cats)
        base = base_points(e)
        lo, hi = model_count_range(e)

        ds = {
            'id': did,
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
            'stats': datasheet_stats(e, index),
            'weapons': collect_weapons(e, index, weapon_pool),
            'abilities': datasheet_abilities(e),
        }
        datasheets.append(ds)

    datasheets.sort(key=lambda d: (d['role'], d['name']))

    return {
        'id': faction_id,
        'name': cat_name.replace('Xenos - ', '').replace('Imperium - ', '')
                        .replace('Chaos - ', ''),
        'source': 'BSData/wh40k-10e',
        'revision': revision,
        'enhancements': detachments(main_root),
        'weapons': list(weapon_pool.values()),
        'datasheets': datasheets,
    }


def main():
    if len(sys.argv) < 4:
        print(__doc__)
        raise SystemExit(1)
    # one or more .cat sources (main faction file, then any Library files
    # it depends on), then faction_id, then the output path.
    *srcs, fid, dest = sys.argv[1:]
    if not srcs:
        print(__doc__)
        raise SystemExit(1)
    data = parse(srcs, fid)
    with open(dest, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=1, ensure_ascii=False)

    ds = data['datasheets']
    print(f"{data['name']}: {len(ds)} datasheets, "
          f"{len(data['enhancements'])} enhancements, "
          f"{len(data['weapons'])} unique weapon profiles "
          f"(rev {data['revision']}) -> {dest}")
    no_stats = [d['name'] for d in ds if not d['stats']]
    if no_stats:
        print(f"   (no stat block found for: {', '.join(no_stats)})")
    roles = {}
    for d in ds:
        roles[d['role']] = roles.get(d['role'], 0) + 1
    for r, n in sorted(roles.items(), key=lambda x: -x[1]):
        print(f"   {r:22} {n}")


if __name__ == '__main__':
    main()
