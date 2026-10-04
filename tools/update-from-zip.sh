#!/bin/bash
# -----------------------------------------------------------------------------------------------------------------
# Update this folder from a delivered zip, cleanly (pass JV, after Mikey found numbered copies in his repository).
# In plain terms: every pass arrives as edusphere-project.zip. Copying it over the old files by hand can leave copies
# behind, named like "index 2.html" or ".gitignore 3" (Finder's Keep Both makes them, and so does iCloud Drive when
# a file changes while it is still syncing), and git then commits the copies along with everything else. This script
# makes the folder match the zip exactly: every file the zip has is copied in fresh, and every file it does not have
# is removed, so a stray copy can never survive an update.
#
# What it never touches: the .git folder (the whole history), .gitattributes, anything .gitignore names (such as
# node_modules and .DS_Store), Claude Code's own .claude/settings.local.json, and pictures or sounds you made
# yourself in art/ or audio/ (anything there the zip does not have stays, unless its name is a numbered copy).
#
# Safety: it stops unless everything is committed, so whatever it removes can always be brought back from git.
# The one exception is a numbered copy git has never seen; those are removed, since they only ever hold an old
# version of a file the zip brings fresh.
#
# Usage, in Terminal, from inside this folder:
#   bash tools/update-from-zip.sh ~/Downloads/edusphere-project.zip
# Tip: type "bash tools/update-from-zip.sh " and drag the zip onto the Terminal window to fill in its path.
# A folder the browser already unzipped works too. Then commit in GitHub Desktop with docs/COMMIT-MESSAGE.md.
# -----------------------------------------------------------------------------------------------------------------
set -u

# A numbered copy: a space and a number at the end of the name, before any extension ("sw 2.js", ".nojekyll 4").
# No file in the project has a space in its name, so this never matches a real file.
is_copy() {
  local base="${1##*/}"
  local re=' [0-9]+(\.[A-Za-z0-9]+)?$'
  [[ $base =~ $re ]]
}

# Files the update leaves alone even though the zip does not have them.
is_kept() {
  case "$1" in
    .gitattributes|.claude/settings.local.json) return 0 ;;
    art/*|audio/*) if is_copy "$1"; then return 1; fi; return 0 ;;
  esac
  return 1
}

main() {
  local SRC_ARG="${1:-}"
  if [ -z "$SRC_ARG" ]; then
    echo "Give the delivered zip, for example:  bash tools/update-from-zip.sh ~/Downloads/edusphere-project.zip"
    return 1
  fi
  if [ ! -e "$SRC_ARG" ]; then echo "Nothing found at: $SRC_ARG"; return 1; fi

  # Work from the top of the repository, wherever in it the script was started.
  local REPO
  REPO="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "Run this from inside your repository folder (the one that holds the .git folder)."; return 1; }
  cd "$REPO" || return 1

  # Stop if anything is uncommitted, other than numbered copies git has never seen.
  local entry dirty=""
  while IFS= read -r -d '' entry; do
    if [ "${entry:0:2}" = "??" ] && is_copy "${entry:3}"; then continue; fi
    dirty="${dirty}    ${entry}"$'\n'
  done < <(git status --porcelain -z --untracked-files=all 2>/dev/null)
  if [ -n "$dirty" ]; then
    echo "Stopped: these changes are not committed yet. Commit them (or discard them) in GitHub Desktop first,"
    echo "so nothing the update removes is lost:"
    printf '%s' "$dirty" | head -40
    return 1
  fi

  # Unpack the zip into a temporary folder (or use a folder that is already unpacked).
  local TMP="" SRC
  if [ -d "$SRC_ARG" ]; then
    SRC="$(cd "$SRC_ARG" && pwd -P)"
  else
    TMP="$(mktemp -d "${TMPDIR:-/tmp}/wise-human-update.XXXXXX")" || return 1
    if ! unzip -q "$SRC_ARG" -d "$TMP"; then echo "Could not unzip: $SRC_ARG"; rm -rf "$TMP"; return 1; fi
    SRC="$TMP"
  fi
  # The zip keeps its files at the top, but a zip made again by hand may wrap them in a folder: find the folder
  # that holds index.html and src/logic.mjs.
  if [ ! -f "$SRC/src/logic.mjs" ]; then
    local f
    while IFS= read -r f; do
      if [ -f "$(dirname "$f")/index.html" ]; then SRC="$(dirname "$(dirname "$f")")"; break; fi
    done < <(find "$SRC" -maxdepth 4 -path '*/src/logic.mjs' -not -path '*/__MACOSX/*')
  fi
  if [ ! -f "$SRC/index.html" ] || [ ! -f "$SRC/src/logic.mjs" ]; then
    echo "That does not look like a delivered project (no index.html and src/logic.mjs inside)."
    [ -n "$TMP" ] && rm -rf "$TMP"
    return 1
  fi
  if [ "$(cd "$SRC" && pwd -P)" = "$(pwd -P)" ]; then
    echo "That is this folder itself. Give the downloaded zip, or the folder it unzipped to."
    return 1
  fi

  # 1. Remove every file the zip does not have, except the kept ones above. Only files git tracks or could track
  #    are considered, so ignored folders such as node_modules are never walked.
  local removed=0
  while IFS= read -r -d '' f; do
    [ -e "$SRC/$f" ] && continue
    is_kept "$f" && continue
    if [ -e "$f" ] || [ -L "$f" ]; then
      rm -f -- "$f" && removed=$((removed + 1)) && echo "  removed  $f"
    fi
  done < <(git ls-files -z --cached --others --exclude-standard)

  # 2. Remove folders left empty (screenshots/, say). The copy below puts back any empty folder the zip has.
  find . -mindepth 1 -type d -empty -not -path './.git' -not -path './.git/*' -not -path './node_modules/*' -delete 2>/dev/null

  # 3. Copy the zip's files in, fresh. "SRC/." copies the folder's contents, hidden files included.
  local count
  count="$(find "$SRC" -type f -not -path '*/__MACOSX/*' | wc -l | tr -d ' ')"
  if ! cp -R "$SRC"/. ./; then echo "The copy failed partway. Nothing is lost: git still has the last commit."; return 1; fi
  # A copy over an existing file keeps that file's old permissions, so give the runnable files (build.sh, check.sh)
  # their runnable bit from the zip.
  while IFS= read -r -d '' f; do chmod +x "./${f#"$SRC"/}" 2>/dev/null; done < <(find "$SRC" -type f -perm -u+x -print0)
  rm -rf ./__MACOSX
  [ -n "$TMP" ] && rm -rf "$TMP"

  echo
  echo "Done: $removed files removed, $count files copied in fresh."

  # Warnings worth acting on: numbered copies inside .git itself, and a folder that iCloud Drive may be syncing.
  local gitcopies
  gitcopies="$(find .git -name '* [0-9]*' 2>/dev/null | head -5)"
  if [ -n "$gitcopies" ]; then
    echo
    echo "Warning: numbered copies inside .git (the history itself), usually left by iCloud Drive:"
    printf '%s\n' "$gitcopies"
    echo "The safest fix is a fresh clone into a folder iCloud does not sync, such as ~/Developer."
  fi
  case "$(pwd -P)/" in
    *"/Library/Mobile Documents/"*|"$HOME/Desktop/"*|"$HOME/Documents/"*)
      echo
      echo "Note: this folder sits where iCloud Drive syncs (iCloud Drive, or Desktop and Documents when that"
      echo "setting is on). iCloud makes numbered copies when files change mid-sync and can damage .git."
      echo "A git repository is safest in a folder iCloud never touches, such as ~/Developer." ;;
  esac

  echo
  local total
  total="$(git status --short 2>/dev/null | wc -l | tr -d ' ')"
  if [ "$total" = 0 ]; then
    echo "Git sees no changes: this folder already matched the zip."
  else
    echo "What git sees now. Commit it in GitHub Desktop with the message in docs/COMMIT-MESSAGE.md:"
    git status --short 2>/dev/null | head -60
    [ "$total" -gt 60 ] && echo "  ...and $((total - 60)) more"
  fi
  return 0
}

# The whole file is read before main runs, so the copy may replace this script safely while it is running.
main "$@"; exit $?
