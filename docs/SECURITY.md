# Security

Written in the security pass of September 25, 2026. The Wise Human is one page that keeps everything on the device it runs on: no server, no online accounts, no analytics. That shapes both what protects it and what cannot.

## What protects what

**Nothing leaves the device from inside the app.** The page makes no network requests of its own. A Content Security Policy in the page head allows it to load and talk to its own site only, so no outside script, plugin or form can be slipped in, and nothing a student types can be sent anywhere by the page. The offline helper (the service worker) keeps copies of the site's own files and nothing else. The Claude preview copy leaves the policy out, because the preview host frames the page with rules of its own.

**Text is shown as text.** Names, notes and answers are drawn by React, which never treats them as code. The one place the app writes page markup itself, the printed sheet of a class's weekly notes, escapes every name and note before it does.

**Backups are checked before they are trusted.** A file larger than 50 MB is refused unread. Everything read from a file or from the device's storage passes through safeJson, which drops the three keys that could change how the app's own objects behave (__proto__, constructor and prototype). A backup must identify itself as one before anything is saved, and restoring merges: it never deletes what is already on the device.

**The educator PIN is a gate.** It is stored as a scrambled number, not as the PIN itself. Every fifth wrong try in a row rests the PIN box: 30 seconds the first time, doubling each time after, never more than 15 minutes, and the count is kept on the device so reloading the page does not reset it. The app also logs out after a stretch of no use.

## What cannot be protected from inside the page

- A PIN is a gate, not a vault. The scramble is a simple one and a PIN is short, and anyone holding the unlocked device with a browser's developer tools can read the stored records directly. The device itself is the real boundary: use a device passcode, give each teacher or class its own browser profile on shared machines, and log out.
- Student PINs are stored as typed. They keep classmates out of each other's work, nothing more.
- A backup file is plain, unencrypted text holding names, notes and progress. Keep backups in a password-protected drive folder, ideally one your school approves, and do not send them by email.
- Clearing the browser's site data deletes everything. Back up regularly.
- Anyone who opens the app can save the page. The code and content are protected by the license and copyright (LICENSE.md, NOTICE.md), not by the page.

## Worth doing later

- Password-protected backups (encrypted with a passphrase the teacher chooses).
- A slower, salted scramble for the educator PIN, upgraded the next time each teacher logs in.
- Scrambled student PINs, if schools ask for it.
