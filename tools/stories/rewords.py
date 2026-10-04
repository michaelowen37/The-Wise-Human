#!/usr/bin/env python3
"""Replace only the words of existing stories (2026-09-28, the flow polish): python3 tools/stories/rewords.py batch.py
The batch file defines NEW = { story_id: [paragraph, ...] }. Paragraph counts must match, so every picture keeps its place.
Write APOS for an apostrophe. Long stories (COURSE_STORIES) use the same file with LONG = { course_id: [...] }."""
import re, sys
src = 'src/stories.mjs'
ns = {}; exec(open(sys.argv[1], encoding='utf-8').read(), ns)
s = open(src, encoding='utf-8').read()
def js(p): return "'" + p.replace('APOS', "'").replace('\\', '\\\\').replace("'", "\\'") + "'"
def swap(table, sid, words):
    global s
    # Stories come in two layouts: the oldest sit inside one object literal (  'id': {), the rest are added one at a
    # time (STORIES['id'] = {). Both keep their words array as a line of '  words: [' closed by '  ],'.
    m = re.search(r"%s\['%s'\] = \{" % (re.escape(table), re.escape(sid)), s)
    if not m:
        # object-literal layout: search only inside that table's literal
        t0 = s.index('%s = {' % table); t1 = s.find('\n};', t0)
        mm = re.compile(r"^  '%s': \{" % re.escape(sid), re.M).search(s, t0, t1 if t1 > 0 else len(s))
        m = mm
    assert m, (table, sid)
    start = m.end()
    wm = re.compile(r"^( *)words: \[\n", re.M).search(s, start); assert wm, sid
    indent = wm.group(1); w0 = wm.start()
    em = re.compile(r"^%s\],\n" % indent, re.M).search(s, wm.end()); assert em, sid
    w1 = em.end()
    old = s[w0:w1]; count = len(re.findall(r"^\s+'", old, re.M))
    assert count == len(words), (sid, count, len(words))
    s = s[:w0] + indent + 'words: [\n' + ''.join(indent + '  ' + js(p) + ',\n' for p in words) + indent + '],\n' + s[w1:]
n = 0
for sid, words in ns.get('NEW', {}).items(): swap('STORIES', sid, words); n += 1
for sid, words in ns.get('LONG', {}).items(): swap('COURSE_STORIES', sid, words); n += 1
open(src, 'w', encoding='utf-8').write(s); print('rewrote words of', n, 'stories')
