#!/usr/bin/env bash
#
# Mirror dotclaude_folder/ into .claude/ as a tree of relative symlinks, so the
# bundled voicebox skill is live in this repo's own .claude/ while its tracked
# source stays in dotclaude_folder/. Idempotent: existing symlinks are refreshed,
# real files (e.g. .claude/settings.json) are left untouched.

set -euo pipefail

# Run from the repository root regardless of the caller's working directory.
cd "$(dirname "$0")/.."

SRC_ROOT="dotclaude_folder"
DST_ROOT=".claude"

if [ ! -d "$SRC_ROOT" ]; then
	echo "error: $SRC_ROOT not found (run from the voicebox_cli repo root)" >&2
	exit 1
fi

# Initialize counters for tracking results
linked=0
skipped=0

# Iterate over all files found in the source root directory
while IFS= read -r src; do
	# Calculate the relative path by removing the source root prefix
	rel="${src#"$SRC_ROOT"/}"
	# Construct the destination path in the target directory
	dest="$DST_ROOT/$rel"
	# Create parent directories if they don't exist
	mkdir -p "$(dirname "$dest")"

	# Refresh our own symlinks; never overwrite a real file.
	# If destination is already a symlink, remove it to refresh
	if [ -L "$dest" ]; then
		rm "$dest"
	# If destination exists but is not a symlink (real file), skip it
	elif [ -e "$dest" ]; then
		echo "skip (real file exists): $dest"
		skipped=$((skipped + 1))
		continue
	fi

	# Calculate the relative path from destination to source using Python
	# This ensures symlinks work correctly regardless of directory depth
	target="$(python3 -c 'import os, sys; print(os.path.relpath(sys.argv[1], sys.argv[2]))' "$src" "$(dirname "$dest")")"
	# Create the symlink
	ln -s "$target" "$dest"
	echo "link $dest -> $target"
	linked=$((linked + 1))
# Read all files from the source root recursively
done < <(find "$SRC_ROOT" -type f)

# Print summary of operation
echo ""
echo "$linked symlink(s) created/refreshed, $skipped real file(s) skipped → $DST_ROOT/"
