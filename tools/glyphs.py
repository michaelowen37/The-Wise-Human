# Bakes the coloring letters as SVG paths from DejaVu Sans Bold into src/ui.jsx (LETTER_GLYPHS).
# Run with python3 tools/glyphs.py when the table needs regenerating; the block in ui.jsx is replaced whole.
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
import json, re
f = TTFont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'); gs = f.getGlyphSet(); cmap = f.getBestCmap()
def glyph(ch):
    g = gs[cmap[ord(ch)]]; pen = SVGPathPen(gs, ntos=lambda v: str(round(v))); g.draw(pen); b = BoundsPen(gs); g.draw(b)
    return {'d': pen.getCommands(), 'adv': g.width, 'box': list(b.bounds)}
table = {ch: glyph(ch) for ch in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'}
block = "const GLYPH_UPM = %d; const GLYPH_CAP = %d;\nconst LETTER_GLYPHS = %s;\n" % (f['head'].unitsPerEm, table['H']['box'][3], json.dumps(table, separators=(',', ':')))
p = 'src/ui.jsx'; s = open(p).read()
s = re.sub(r"const GLYPH_UPM = \d+; const GLYPH_CAP = \d+;\nconst LETTER_GLYPHS = \{.*?\};\n", block, s, count=1, flags=re.S)
open(p, 'w').write(s); print('glyphs written')
