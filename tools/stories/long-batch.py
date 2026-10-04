# The Wise Human. Copyright (c) 2026. Source-available; not for reuse. See LICENSE.md.
# Long-story batch driver (2026-09-24): doubles course stories. Run: python3 tools/stories/long-batch.py <batch.py>
# The batch file holds NEW = { courseId: dict(about, alt, more=[(scene, after) x5], words=[...]) } and BG = { courseId: 'background' },
# apostrophes written APOS. It rewrites each one-line entry in COURSE_STORIES (about, scene, words, five more pictures with
# CS serials after the last one in the ledger), updates the main ledger row's scene and adds five rows in Mikey's template.
# Apply a batch of doubled long stories: story data, ledger rows, and (once) the tests and the printed book.
import re, json, subprocess, sys
NEW = {}; BG = {}; exec(open(sys.argv[1]).read())
s = open('src/stories.mjs', encoding='utf-8').read(); L = open('docs/ART-REQUESTS.md', encoding='utf-8').read()
q = lambda t: t.replace('APOS', "\\'")
next_cs = max(int(x) for x in re.findall(r'^\| CS(\d+) \|', L, flags=re.M)) + 1
subj = json.loads(subprocess.check_output(['node', '-e', "import('./src/logic.mjs').then((L)=>console.log(JSON.stringify(Object.fromEntries(L.COURSES.map((c)=>[c.id,c.subject])))))"]).decode())
b = open('tools/stories/batch.py').read(); MOD = eval(re.search(r'^MOD = (\{.*\})$', b, re.M).group(1)); NEG = re.search(r"^NEG = '([^']*)'", b, re.M).group(1)
def prompt(scene, subject, bg):
    mod, anchor = MOD.get(subject, ('wonder-filled and vibrant', 'dynamic close-up'))
    return f"{scene}, {mod}. Style: Clean 3D vector illustration, vibrant and engaging color palette, minimalist {bg} background, balanced lighting. Professional educational graphic style, clear focal point, uncluttered layout, {anchor}."
rows = []
for cid, d in NEW.items():
    # Each long story sits on one line: 'id': { title: ..., about: ..., art: ..., alt: ..., cast: [...], words: [...] },
    m = re.search(r"^[ \t]*'" + re.escape(cid) + r"': \{.*\},?$", s, re.M)
    if not m: raise SystemExit('line not found ' + cid)
    block = m.group(0); art = re.search(r"art: '(CS\d+)'", block).group(1)
    old_alt = re.search(r"alt: '((?:[^'\\]|\\.)*)'", block).group(1).replace("\\'", "'")
    nb = re.sub(r"about: '(?:[^'\\]|\\.)*'", lambda _: "about: '" + q(d['about']) + "'", block, count=1)
    nb = re.sub(r"alt: '(?:[^'\\]|\\.)*'", lambda _: "alt: '" + q(d['alt']) + "'", nb, count=1)
    have = re.findall(r"serial: '(CS\d+)'", nb)
    serials = have[:5] if len(have) == 5 else [f'CS{next_cs + k}' for k in range(5)]
    if len(have) != 5: next_cs += 5
    nb = re.sub(r", more: \[.*?\}\]", "", nb, count=1) if have else nb
    words = "words: [" + ", ".join("'" + q(w) + "'" for w in d['words']) + "]"
    more = "more: [" + ", ".join(f"{{ serial: '{ser}', after: {aft}, alt: '{q(alt)}' }}" for ser, (alt, aft) in zip(serials, d['more'])) + "]"
    nb, n = re.subn(r"words: \[(?:'(?:[^'\\]|\\.)*'(?:, )?)*\]", lambda _: words + ", " + more, nb, count=1)
    assert n == 1 and nb.count("more: [") == 1, cid
    s = s.replace(block, nb, 1)
    lines = L.split('\n'); k = next(i for i, x in enumerate(lines) if x.startswith(f'| {art} |'))
    lines[k] = lines[k].replace(old_alt, d['alt'].replace('APOS', "'")); ch = re.search(r'Character: (C\d+)\.', lines[k]); lead = ch.group(1) if ch else None
    lines = [x for x in lines if not any(x.startswith(f'| {ser} |') for ser in serials)]
    for ser, (alt, aft) in zip(serials, d['more']):
        a = alt.replace('APOS', "'"); tag = f' Character: {lead}.' if lead and re.search(r'\b(boy|girl|brother|brothers)\b', a) else ''
        rows.append(f"| {ser} | {cid} | {a} | {prompt(a, subj[cid], BG[cid])}{tag} | {NEG} | Needed |")
    L = '\n'.join(lines)
lines = L.split('\n'); last = max(i for i, x in enumerate(lines) if re.match(r'^\| CS\d+ \|', x)); lines[last + 1:last + 1] = rows; L = '\n'.join(lines)
L = L.replace('One picture each, delivered like story art', 'One picture each until a story is doubled, then six (2026-09-24), delivered like story art', 1)
open('src/stories.mjs', 'w', encoding='utf-8').write(s); open('docs/ART-REQUESTS.md', 'w', encoding='utf-8').write(L)
print('long stories written; rows', len(rows), 'next CS', next_cs)
