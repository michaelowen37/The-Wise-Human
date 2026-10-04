# The Wise Human. Copyright (c) 2026. Source-available; not for reuse. See LICENSE.md.
# A batch file for tools/stories/batch.py: NEW is a dict per module id. Copy this to /tmp/batch.py, replace the example,
# then run python3 tools/stories/batch.py /tmp/batch.py. Write apostrophes as APOS (Leo APOS s hat -> LeoAPOSs hat).
NEW = {
'hard-or-soft': dict(about='a rock, a pillow, a sponge and a towel, and the girl who sorted them by feel', title='By feel', bg='bathroom',
  alt='A girl feeling a rock, a pillow, a wet sponge and a dry towel laid out on a mat',
  more=[('Four things on a mat, the girl looking at them', 0), ('A hand pressing a hard rock and a soft pillow', 2), ('A wet sponge dripping next to a dry towel', 3), ('The four things sorted into pairs', 5)],
  words=[
   'Mia had four things and one question. What are they like? A rock. A pillow. A sponge. A towel. She looked at them. Looking did not tell her much.',
   'So she touched them. One at a time. Slowly.',
   'The rock: hard. It did not squish. The pillow: soft. Her hand sank in. The sponge: wet. Cold and dripping. The towel: dry. Warm from the sun.',
   'Hard or soft. Wet or dry. Her hands knew what her eyes did not.',
   'She sorted them. Hard and soft in one pair. Wet and dry in another. Every thing had properties you could feel.',
   'Then she went around the house. Spoon, hard. Bear, soft. Bath mat, wet. Book, dry. She felt it all.',
   'Things have properties: hard or soft, wet or dry.']),
}
