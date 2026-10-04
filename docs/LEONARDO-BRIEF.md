# Leonardo brief

A standing brief to paste into Leonardo's assistant or agent, or to keep beside the prompt box, so every EduSphere picture comes out of the same world. It is written to be reused as-is.

## The brief

You are illustrating EduSphere, a children's learning app for pre-K through high school. Every image follows one template and one look, so a math picture and a history picture sit side by side as one family:

`[Core Subject Concept], [Playful Modifier]. Style: Clean 3D vector illustration, vibrant and engaging color palette, minimalist [scene] background, balanced lighting. Professional educational graphic style, clear focal point, uncluttered layout, [Visual Anchor].`

The modifier and the anchor change with the subject, and nothing else does:

| Subject | Playful modifier | Visual anchor and composition | Background |
|---|---|---|---|
| Science | wonder-filled and vibrant, stylized, curious | dynamic close-up, glowing elements, soft shadows | minimalist lab or field background |
| History | friendly and whimsical yet respectful, stylized historical accuracy | heroic composition, soft cinematic lighting, simple period elements | minimalist period background |
| Math | cheerful and neat, colorful, geometric | distinct geometric shapes, high-contrast axes, no text labels | minimalist solid background |
| Reading and Writing | imaginative and expressive, storybook style | character-focused, dreamy lighting, central framing | minimalist library or storybook background |
| Art, Music, Technology, Health | as Reading for people, as Science for things | character-focused or dynamic close-up | minimalist background |

Sample prompts in this voice: a baking soda volcano erupting with colorful foam, wonder-filled and vibrant, minimalist lab background, dynamic close-up. George Washington crossing the Delaware, friendly and whimsical yet respectful, minimalist river background, heroic composition. A 3D pie chart of a pizza cut into parts, cheerful and neat, minimalist solid background, distinct geometric shapes. A friendly owl in oversized glasses reading a giant glowing book, imaginative and expressive, minimalist library background, character-focused.

Rules that never change:
1. No text of any kind in the image: no words, letters, labels, numbers, signs, logos. Anything that needs writing (a periodic table, a chart, a clock face, a map's names) is drawn by the app, not by you. Negative prompt, always: `text, words, letters, labels, numbers, logos, watermark, signature, blurry, extra fingers, extra limbs, deformed hands, photorealistic skin`.
2. One model pipeline for the whole set: Leonardo Vision XL or Leonardo Diffusion XL with the 3D Render or Cute 3D style, the same aspect ratio for story scenes (4:3), minimalist or solid backgrounds, one clear focal point. Never switch models between subjects; the template gives the variety.
3. Keep backgrounds minimalist so the eye lands on the concept. Wholesome always: kind faces, warm light, nothing frightening, no violence shown even in history scenes (show the walls of the Alamo, not the battle; show the torn map, not the field).
4. Recurring characters must be recognizable across years. Each has a character sheet (C serial). When a scene names a sheet, use that sheet as the character reference at high strength, keep the face, eye color, skin tone, hair color and build exactly, and change only what the scene asks for (age, clothes, setting). Never redesign a character to fit a scene.

## The cast, as they age (same person, features kept)

- Mike: brown eyes, sturdy build, warm half-smile. As a boy: shaved-short hair. As a man: bald, close-cropped dark beard, a black ring, dark rolled-sleeve shirts.
- Chloe: wavy dark hair, bright patterned clothes at every age, paint somewhere on her.
- Frederick: neat dark hair and glasses when young; as a professor, gray hair, a large gray handlebar mustache, always a white lab coat.
- Georgette: short auburn hair, a red button-front coat, a warm knowing smile; she does not grow up, she grows older.
- Savanah: copper-red hair (tied up on the farm, in a high bun in the city), freckles, a small line tattoo on one forearm as an adult, tortoiseshell sunglasses pushed up.
- Jaxon: sandy light-brown hair, a green checkered shirt, a sly kind smile.
- Harlow: blonde curls in two pigtails with sage-green bows, big blue eyes.

## How to keep them consistent, step by step

1. Generate the character sheets first (C1 to C11 in docs/ART-REQUESTS.md): front and side view, neutral pose, plain background. Iterate until the face is right, then lock that image: it is the reference for everything after.
2. For every scene that names a sheet, attach the sheet as the character reference (strength high) and, for the set's look, one approved scene as the style reference. Keep the seed of a good result and reuse it when re-rolling small changes.
3. Aging a character: start from the previous chapter's sheet as the reference and describe the change as an addition ("the same face, now with a close dark beard and no hair"), never as a new description. Save the result as the next sheet.
4. If Leonardo offers custom Elements (a trained model of a character), train one per core character from its sheets and use it with the sheet reference; that is the most reliable path for a cast that appears across hundreds of pictures.
5. Name every export by its serial (S14.png), and upload it with the serial. The app stores it as art/stories/S14.webp.
