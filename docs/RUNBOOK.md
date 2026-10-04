# EduSphere runbook

What to do when something goes wrong, written for the person who owns the product
rather than for an engineer. Keep this file current. When a real incident happens,
add what you learned at the bottom.

## How educators get updates

Serve `index.html` from GitHub Pages: push the repository, turn on Pages for the
main branch in the repository settings, and the app is live at your GitHub address.
Every push updates it. Educators get the newest version by opening the site. No
email, nothing to install. One caveat: a
browser may keep an old copy for a while. If someone reports a bug you have already
fixed, ask them to reload once with a hard refresh.

Never break old backups. A backup file from each format version lives in
`tests/fixtures` and `./check.sh` fails if any of them stops restoring.

## Today: phase 0

There is no server. The product is one file that runs inside the browser, and every
student's record lives on that device. That means:

- Nothing can go down at 2 a.m., because nothing is running.
- A bug reaches a school only when they load a new copy of the file.
- "I lost my data" means the browser's storage was cleared or the device changed.
  Phase 0 keeps no copy anywhere else. Say so plainly when you sell it.

The only maintenance in phase 0 is fixing bugs in the file and sending a new one.

## Phase 1: what changes

Phase 1 adds accounts, a database and a website. From that day there are things that
can break while you are asleep, so the setup below is not optional.

### Use managed services for everything
Pay someone else to keep each piece running. The rule of thumb: if a service does not
have a status page and a support address, do not build on it.

- Database: a managed Postgres with automatic daily backups and point-in-time restore.
- Sign-in: a hosted identity service. Never store passwords yourself.
- Hosting: a platform that redeploys from the repository with one click and can roll
  back to the previous version with one click.
- Error reporting: a service that emails you when the app throws an error a user saw.
- Uptime monitoring: a service that checks the site every minute and texts you when
  it fails.
- A public status page: one line that says whether things are working. Schools look
  here before they email you.

### Keep a developer within reach
A part-time developer on a small monthly retainer, who has read CLAUDE.md and can run
`./check.sh`. You will need them perhaps twice a year, and the day you need them you
will need them quickly. Agree a response time in writing.

## When a customer reports a problem

1. Write down exactly what they said, when it happened, which device and browser, and
   which student ID. Ask them for a screenshot. Do not diagnose on the phone.
2. Check the status page and the uptime monitor. If the site is down, go to
   "When the site is down" below and stop reading this section.
3. Try to reproduce it yourself with a test student. Most reports fall into one of:
   - They cannot sign in. Almost always a forgotten PIN or a student picked the wrong
     name. Check the roster first.
   - A number looks wrong. Every number is recomputed from the record, so open Raw
     data on that student's report and read the last few lines. The record is the truth.
   - A screen looks broken. Ask which browser. If it is an old one, that is the answer.
   - Work "disappeared". In phase 0, storage was cleared. In phase 1, check the
     database backups before promising anything.
4. If you cannot reproduce it in fifteen minutes, send it to your developer with your
   notes and the screenshot. Tell the customer you have it and when you will reply.
5. Reply within one working day, even if the reply is "still looking".

## When the site is down

1. Check the status pages of your hosting, database and sign-in providers. If one of
   them is down, the fix is theirs. Post on your status page: "We are aware and it is
   with our provider." Nothing else you do will help.
2. If the providers are fine and the site is not, roll back to the previous version.
   One click on the hosting platform. This fixes the majority of outages that are
   your own, because the most likely cause is the last change.
3. If rollback does not fix it, call the developer. This is the "quickly" case.
4. Post on the status page every thirty minutes until it is fixed, even if the update
   is "no change yet". Silence is what customers remember.
5. When it is fixed, write three lines: what broke, what fixed it, what stops it
   happening again. Add them to the bottom of this file.

## Before any change reaches a school

- `./check.sh` must end with ALL CHECKS PASSED.
- Try the change yourself on a phone and a laptop.
- Never ship on a Friday afternoon or the day before a school's first day.
- Keep the previous version ready to roll back to.

## Backups and data requests

- Backups are automatic and kept for at least thirty days. Test a restore once a term.
  A backup you have never restored is a hope, not a backup.
- When a school asks for a student's data, or asks you to delete it, they are entitled
  to both. Export from the database, send it, confirm deletion in writing. Keep the
  written confirmation.
- Never email student records to anyone who has not been verified as the school.

## Incident log

(Add entries here. Date, what happened, what fixed it, what changed as a result.)
