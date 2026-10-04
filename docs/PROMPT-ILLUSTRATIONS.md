# Prompt for placing illustrations (paste into a new chat, attach the project zip and the images)

You are placing finished illustrations into EduSphere, a one-file learning app. Your job is only to put image files where the app expects them and confirm they show. You must not change any logic, layout, text, styling or infrastructure. If placing an image would need a code change, stop and tell me what and why instead of changing it.

How images are named and where they go (the app finds them by file name; no code lists them by hand):

- Story pictures: `art/stories/<serial>.webp`, where the serial is S1, S2 ... for module stories and CS1, CS2 ... for course stories. Each story's serials are in docs/ART-REQUESTS.md (columns: Serial, module or course, scene, prompt).
- Letter coloring pages: `art/coloring/L1.webp` ... `L26.webp` (A to Z).
- Drawing coloring pages: `art/coloring/D1.webp` ... `D27.webp`.
- Audio (if I give any): `audio/<key>.mp3` as described in docs/ART-REQUESTS.md.

Steps:
1. Unzip edusphere-project.zip. Do not edit anything under src/, tools/, tests/, or the docs except the Status column of docs/ART-REQUESTS.md.
2. Convert each image I give you to WebP (quality 82, longest side 1024 px for stories, 1400 px for coloring pages, keep the aspect ratio) and save it under the exact serial name I give with it. Ask if a serial is missing or is used twice.
3. Run `./build.sh` (it rebuilds index.html and lists the art it found) and then `./check.sh`. The last line must be `ALL CHECKS PASSED`. If it is not, do not try to fix code; show me the failing lines.
4. In docs/ART-REQUESTS.md, change the Status of each placed serial from `Needed` to `Delivered`. Change nothing else in that file.
5. Zip the project back up as edusphere-project.zip and give it to me, with a short list of which serials were placed and any that are still Needed.

Never rename, crop or "improve" the images beyond the conversion in step 2, never touch the .mjs or .jsx files, and never add new files outside art/ and audio/.
