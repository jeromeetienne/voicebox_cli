#!/usr/bin/env bash
#
# end2end_speak.sh — generate an .mp3 saying a sample sentence using the
# `speak` command and the first voice profile returned by the API.
#
# It lists the profiles, picks the first one, and runs `speak` to synthesize
# the text into an audio file.

# Exit on any error, undefined variable, or pipe failure
set -euo pipefail

# Change to the project root directory
cd "$(dirname "$0")/../.."

# Configuration
TEXT='Hello world, how are you today?'
OUTPUT='outputs/end2end_speak.mp3'

# Fetch available voice profiles from the API
echo '==> Fetching profiles...'
PROFILES="$(npx voicebox-cli profiles list)"

# Check if any profiles were returned
if [ -z "${PROFILES}" ]; then
	echo 'error: no voice profiles found' >&2
	exit 1
fi

# Extract the ID and name of the first profile
FIRST_PROFILE_ID="$(printf '%s\n' "${PROFILES}" | head -n 1 | awk '{print $1}')"
FIRST_PROFILE_NAME="$(printf '%s\n' "${PROFILES}" | head -n 1 | awk '{print $2}')"
echo "==> Using first profile: ${FIRST_PROFILE_ID} (${FIRST_PROFILE_NAME})"

# Create the output directory if it doesn't exist
mkdir -p "$(dirname "${OUTPUT}")"

# Generate the audio file using the selected profile
echo "==> Speaking '${TEXT}'..."
npx voicebox-cli speak "${TEXT}" --profile "${FIRST_PROFILE_ID}" --output "${OUTPUT}"

# # Play the generated audio file
# echo "==> To play the generated audio file, run:"
# echo "afplay \"${OUTPUT}\""

# Confirm completion
echo "==> Done: ${OUTPUT}"
