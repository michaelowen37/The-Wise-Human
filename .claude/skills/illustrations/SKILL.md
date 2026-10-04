---
name: illustrations
description: How pictures come into EduSphere: the Leonardo prompt template, serials, file paths, sizes, and placeholders. Use whenever a picture is requested, received, or wired into a screen.
---
# Illustrations

## The prompt template (Mikey's rule)

`[Core Subject Concept], [Playful Modifier]. Style: Clean 3D vector illustration, vibrant and engaging color palette, minimalist background, balanced lighting. Professional educational graphic style, clear focal point, uncluttered layout, [Visual Anchor].`

Fill it by subject: science (wonder-filled, vibrant, stylized; dynamic close-up, glowing elements, soft shadows), history (whimsical yet respectful, stylized historical accuracy; heroic composition, soft cinematic lighting), math (colorful, geometric, cheerful, neat; high-contrast, distinct geometric shapes, no text labels), reading and writing (imaginative, storybook style, expressive; character-focused, dreamy lighting, central framing).

Three golden rules: forbid text in the negative prompt (text, words, letters, labels, numbers); one model pipeline for the whole set (Leonardo Vision XL or Diffusion XL with the 3D Render or Cute 3D style); minimalist or solid backgrounds. Anything with writing on it (a periodic table, a graph, a clock face) is drawn by the app, not requested.

## Serials and files

Serials: S story scene, C character sheet, I item picture, G game or coloring page, L logo. Numbers never change. The ledger is `docs/ART-REQUESTS.md`.

Story scenes are raster: Mikey uploads PNG or JPG, Claude resizes to about 1200 px wide and converts to WebP (`python3` with Pillow, which the sandbox has), and saves it as `art/stories/<serial>.webp`. They are loaded only when a story opens, so index.html does not grow. Never inline them as base64.

Icons and coloring pages are vector: ask Leonardo for flat, solid-color, no-gradient art, vectorize, and keep them small; a vectorized 3D render is huge and blurry and is refused.

## Reuse

A story picture belongs to one story. A drawn diagram kind may serve several lessons only with its own parameters each time (a different bar, a different angle); an identical picture on two lessons fails the rules test. Across modules, courses, stories and grades the aim is that nothing feels recycled.

## Placeholders

A story whose picture is missing shows a dashed frame with its serial. Coloring pages never show a placeholder; a page without art simply is not listed.
