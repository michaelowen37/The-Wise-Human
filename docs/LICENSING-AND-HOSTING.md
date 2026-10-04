# Licensing and hosting, explained

Written 2026-10-01 (pass HI) for Mikey and for any developer who picks this up. It explains how the license codes work, what they can and cannot protect, and what changes if the repository goes private and the site moves to another host.

## How a license code works today

A code reads `TWH1.<payload>.<signature>`. The payload is a little JSON note, `{ id, name, year, until }`: who the license is for, the school year, and the date it ends. The signature is made from that note with iECHO's **private key**, using ECDSA P-256 with SHA-256. The app holds only the matching **public key** (`LICENSE_PUBLIC_KEY` in `src/logic.mjs`) and checks every code offline with the browser's own cryptography (`checkLicenseCode`).

Think of a notary's seal. The private key is the stamp, and only iECHO keeps it. The public key is the published picture of the seal: anyone can hold a document next to it and see whether the seal is real, but nobody can make the stamp from the picture. So the public key is meant to be public. Shipping it inside the app gives nobody the power to create codes, and changing a single letter of a code's payload breaks its signature.

Two rules follow. The private key never goes in any repository, public or private; keep it offline, in a password manager or on an encrypted drive. And if it ever leaks, make a new pair with `tools/license-keys.mjs`, ship the new public key, and reissue codes.

**Before launch:** the key in the code today is a development key, and its private half sits in `tests/fixtures/` so the tests can make codes. Anyone who reads the repository could make codes that this key accepts. That is harmless only while `LICENSING_LAUNCHED` is false. Before launch, Mikey makes the real pair on his own computer and pastes in only the new public key.

## What a signed code cannot stop

1. **Sharing.** A code is like a printed ticket: a copy works for anyone who has it. The payload limits the damage: the child's name shows in the app, so a shared code is visible, and `until` ends it with the school year.
2. **Editing the app.** Everything runs in the visitor's browser. A technical person can save the page, change the JavaScript to skip the check, and run their copy. No check that runs only on the user's device can prevent this; it is a lock on a screen door, enough for honest people.
3. **Reading the paid lessons.** Today every lesson, free and paid, ships inside the one `index.html`. The paid curriculum can be read in the page source without any code at all.

## Stronger options, from least to most work

1. **Honor system with names and dates (today's design).** It fits a product sold to families and schools through Texas Education Freedom Accounts, where buyers are not adversaries.
2. **Online activation.** A small server, such as a Cloudflare Worker with a small database, records how many devices have used each code and refuses past a limit. The app asks it once when a code is entered and works offline after that. This changes the "we send nothing anywhere" promise, so the privacy note must say exactly what is sent: the code and a device count, nothing about the child's learning.
3. **Paid lessons served from the server.** Pre-K and kindergarten stay in the free bundle; grade 1 and up are downloaded only after a code is activated, then kept on the device for offline use. Copying the public site would no longer copy the curriculum. A paying user could still save what they receive; nothing delivered to a browser is copy-proof.

The recommendation: launch with option 1, and build option 3 (which needs option 2) when the curriculum itself is the asset worth protecting, likely before a wide public launch.

## Making the real key pair (no outside service)

No third-party service is needed, and none should be used: any website that generates the pair for you sees the private key. The project carries its own tools, and they use the same cryptography built into every browser and into Node.js, offline.

1. On your own computer (not a shared one), open a terminal in the project folder. Node.js must be installed.
2. Run `node tools/license-keys.mjs ~/Documents/wise-human-license-private.json`, giving any path outside the project folder. The private key is written there, readable only by your account, and the public key is printed on the screen.
3. Paste the printed public key into `LICENSE_PUBLIC_KEY` in `src/logic.mjs`. When it goes in, the license browser test must keep signing with the development key, so the test page should carry the development public key; this is a small change to make in the same pass.
4. Store the private key file in a password manager, keep one backup on an encrypted drive, and delete any other copies.
5. To issue a code: `node tools/license-sign.mjs <private-key.json> TX-0001 "Child's name" 2026-27 2027-07-31`. It prints the code to send.
6. If the private key ever leaks, make a new pair, ship the new public key, and reissue codes; old codes stop working.

## Educators can always walk through

An educator's walk-through ("Walk through as a student" on the Classroom page) shows every course in the chosen band, paid or free, whether or not any license has been bought. The license check applies only to a student's own sessions. The license browser test proves this with licensing switched on and no code saved (pass HJ).

## Images in the app

**Technically**, any image the app shows can be saved by anyone who opens the site: the browser has to download a picture to display it, and a screenshot defeats every trick. Blocking right-click is cosmetic.

**Legally**, protection comes from ownership, copyright and terms of use, and two facts matter. First, Leonardo's terms: images generated privately on a paid plan belong to you, as between you and Leonardo, while free-plan images are public, owned by Leonardo, and open for other users to remix. Generate every picture for the app privately on a paid plan. Second, in the United States, an image made by AI from a prompt alone may not be copyrightable at all, because copyright needs a human author; human choices, such as editing, combining and arranging pictures with the stories, strengthen the claim, and the app as a whole (curriculum, stories, pictures and their arrangement) is a compilation that can be protected. This is general information, not legal advice; an intellectual property lawyer can say how it applies.

**Practically:** publish terms of use that forbid reuse, keep full-size originals private and ship web-sized copies, and, if paid lessons are ever served only after activation, serve their pictures the same way.

## A private repository, and hosting on Cloudflare or Vercel

**What going private protects:** the source history, the docs, the tests, the tools, the picture prompts and the plans. **What it does not protect:** the built `index.html`, because a browser must download code to run it. Anyone can view the source of the live site, private repository or not. Minifying the code only slows a reader down.

**Hosts.** GitHub Pages serves a private repository only on a paid GitHub plan, and the site itself is still public. Cloudflare Pages and Vercel both connect to a private GitHub repository and publish on every push. Cloudflare's free plan allows business use. Vercel's free Hobby plan is for personal, non-commercial projects only, so a product that sells licenses needs Vercel Pro, at $20 per user per month at the time of writing. Check both providers' current terms before choosing.

**Loading on devices:** no difference. Both serve plain static files over HTTPS from a fast network, the service worker keeps working, and any modern browser loads the site the same way.

**The real catch is the move itself.** A browser keeps saved data per web address. Everything The Wise Human stores (students, records, the educator account and PIN) lives on the device under `elowen37.github.io`. At a new address, every device starts empty. Plan the move: on each device, take a backup at the old address, open the new address, create the educator account, then restore the backup. Keep the old site up for a while with a note pointing to the new one, because devices that never visit the new address keep running the old copy their service worker saved. Move once, to the permanent domain, so families only do this one time.
