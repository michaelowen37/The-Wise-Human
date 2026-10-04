#!/usr/bin/env bash
# The one check to run after ANY change. Ends with "ALL CHECKS PASSED" or a failure.
set -u
cd "$(dirname "$0")"
fail=0
echo "1/13 rules tests";  node tests/logic.test.mjs | tail -1 | tee /tmp/edu_t.txt; grep -q " 0 failed" /tmp/edu_t.txt || fail=1
echo "2/13 curriculum coverage"; node tests/coverage.test.mjs | grep -E 'FAIL|NOTE|passed' | tee /tmp/edu_c.txt; grep -q " 0 failed" /tmp/edu_c.txt || fail=1
echo "3/13 spelling and style"; node tests/spelling.test.mjs | tail -1 | tee /tmp/edu_sp.txt; grep -q " 0 failed" /tmp/edu_sp.txt || fail=1
echo "4/13 lesson lines and pictures"; node tests/scripts.test.mjs | tail -1 | tee /tmp/edu_sc.txt; grep -q " 0 failed" /tmp/edu_sc.txt || fail=1
echo "5/13 stories";      node tests/stories.test.mjs | tail -1 | tee /tmp/edu_st.txt; grep -q " 0 failed" /tmp/edu_st.txt || fail=1
echo "5b/11 art ledger";  node tests/ledger.test.mjs | tail -1 | tee /tmp/edu_le.txt; grep -q " 0 failed" /tmp/edu_le.txt || fail=1
echo "5c/11 pictures";    node tests/pictures.test.mjs | tail -1 | tee /tmp/edu_pi.txt; grep -q " 0 failed" /tmp/edu_pi.txt || fail=1
echo "6/13 old backups still restore"; node tests/backup-forever.test.mjs | tail -1 | tee /tmp/edu_b.txt; grep -q " 0 failed" /tmp/edu_b.txt || fail=1
echo "6b/13 updating a folder from a delivered zip"; node tests/update-from-zip.test.mjs | tail -1 | tee /tmp/edu_up.txt; grep -q " 0 failed" /tmp/edu_up.txt || fail=1
echo "7/13 build";        ./build.sh || fail=1
echo "8/13 render smoke"; npx tsx tests/render.smoke.test.mjs 2>&1 | grep -E "^(PASS|FAIL)" | tail -1 | tee /tmp/edu_s.txt; grep -q "^PASS" /tmp/edu_s.txt || fail=1
echo "9/13 syntax";       tsc --noEmit --allowJs --jsx preserve --target es2022 --module esnext --moduleResolution bundler dist/edusphere-prototype.jsx 2>&1 | grep -v "Cannot find module 'react'" | tee /tmp/edu_x.txt; [ -s /tmp/edu_x.txt ] && fail=1
# The click-through keeps its whole log in /tmp/edu_click_through.log, so a failure can be read in full (pass HC).
echo "10/13 browser click-through (four to six minutes)"; node tests/e2e/make-page.mjs >/dev/null && timeout 480 node tests/e2e/click-through.mjs > /tmp/edu_click_through.log 2>&1; tail -1 /tmp/edu_click_through.log | tee /tmp/edu_e.txt; grep -q " 0 failed" /tmp/edu_e.txt || fail=1
echo "10/13 license codes in the browser"; timeout 120 node tests/e2e/license.mjs 2>&1 | tail -1 | tee /tmp/edu_lic.txt; grep -q " 0 failed" /tmp/edu_lic.txt || fail=1
echo "10/13 dragging with a desktop mouse"; timeout 150 node tests/e2e/drag.mjs 2>&1 | tail -1 | tee /tmp/edu_drag.txt; grep -q " 0 failed" /tmp/edu_drag.txt || fail=1
echo "10/13 changing the educator PIN"; timeout 120 node tests/e2e/educator.mjs 2>&1 | tail -1 | tee /tmp/edu_educator.txt; grep -q " 0 failed" /tmp/edu_educator.txt || fail=1
echo "10/13 the first week tour, card by card, and pages that open at the top"; timeout 300 node tests/e2e/tour.mjs 2>&1 | tail -1 | tee /tmp/edu_tour.txt; grep -q " 0 failed" /tmp/edu_tour.txt || fail=1
echo "11/13 back button from every screen"; timeout 200 node tests/e2e/back-sweep.mjs 2>&1 | tail -1 | tee /tmp/edu_back.txt; grep -q " 0 failed" /tmp/edu_back.txt || fail=1
echo "12/13 dark theme: every word readable, paper screens light"; timeout 200 node tests/e2e/dark-contrast.mjs 2>&1 | tail -1 | tee /tmp/edu_dark.txt; grep -q " 0 failed" /tmp/edu_dark.txt || fail=1
echo "13/13 standalone page keeps its data"; timeout 120 node tests/site.test.mjs 2>&1 | tail -1 | tee /tmp/edu_site.txt; grep -q " 0 failed" /tmp/edu_site.txt || fail=1
if [ "$fail" = 0 ]; then echo "ALL CHECKS PASSED"; else echo "CHECKS FAILED - read the lines above"; exit 1; fi
