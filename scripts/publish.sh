#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v git >/dev/null 2>&1; then
	echo "Error: git is not installed." >&2
	exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
	echo "Error: npm is not installed." >&2
	exit 1
fi

if [ ! -f package.json ]; then
	echo "Error: package.json not found at project root." >&2
	exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
	echo "Error: current directory is not a git repository." >&2
	exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
	echo "Warning: working tree is not clean."
	echo "Changed files:"
	git status --short
	echo
	read -r -p "Continue publish and commit only package version files? [y/N]: " continue_publish
	case "${continue_publish:-N}" in
		y|Y|yes|YES)
			echo "Continuing with dirty working tree (only version files will be committed)."
			;;
		*)
			echo "Publish cancelled. Please commit/stash your changes first." >&2
			exit 1
			;;
	esac
fi

current_version="$(node -p "require('./package.json').version")"

IFS='.' read -r major minor patch <<<"$current_version"

if [ -z "${major:-}" ] || [ -z "${minor:-}" ] || [ -z "${patch:-}" ]; then
	echo "Error: package.json version is not in x.y.z format: $current_version" >&2
	exit 1
fi

patch_next="${major}.${minor}.$((patch + 1))"
minor_next="${major}.$((minor + 1)).0"
major_next="$((major + 1)).0.0"

echo "Current version: v${current_version}"
echo
echo "Choose release type:"
echo "1) patch - bugfix/small change      (example: v1.0.9 -> v1.0.10)"
echo "2) minor - new backward-compatible feature (example: v1.0.9 -> v1.1.0)"
echo "3) major - breaking changes         (example: v1.0.9 -> v2.0.0)"
echo
echo "Preview from current v${current_version}:"
echo "- patch: v${patch_next}"
echo "- minor: v${minor_next}"
echo "- major: v${major_next}"
echo

read -r -p "Enter choice [1/2/3] (default: 1): " choice

release_type="patch"
case "${choice:-1}" in
	1) release_type="patch" ;;
	2) release_type="minor" ;;
	3) release_type="major" ;;
	*)
		echo "Invalid choice: ${choice}. Use 1, 2, or 3." >&2
		exit 1
		;;
esac

echo "Bumping version using: ${release_type}"
npm version "$release_type" --no-git-tag-version

new_version="$(node -p "require('./package.json').version")"
commit_message="publish to ${new_version}"
tag_name="v${new_version}"

git add package.json
commit_paths=(package.json)
if [ -f package-lock.json ]; then
	git add package-lock.json
	commit_paths+=(package-lock.json)
fi

git commit -m "$commit_message" -- "${commit_paths[@]}"

git tag -a "$tag_name" -m "$commit_message"

current_branch="$(git rev-parse --abbrev-ref HEAD)"

echo "Pushing commit to origin/${current_branch}..."
git push origin "$current_branch"

echo "Pushing tag ${tag_name}..."
git push origin "$tag_name"

echo
echo "Publish completed successfully."
echo "- Commit: ${commit_message}"
echo "- Tag: ${tag_name}"
