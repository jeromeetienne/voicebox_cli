#!/usr/bin/env bash
#
# end2end_transcribe.sh — synthesize a sample sentence into an audio file, then
# transcribe it back to text using the `transcribe` command.
#
# It first generates an audio file with `speak` (using the first voice profile),
# then runs `transcribe` on that file and prints the recovered text.

# Exit on any error, undefined variable, or pipe failure
set -euo pipefail

# Change to the project root directory
cd "$(dirname "$0")/../.."

# Configuration
TEXT='Hello world, how are you today?'
AUDIO_FILE='outputs/end2end_transcribe.mp3'

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
mkdir -p "$(dirname "${AUDIO_FILE}")"

# Generate the audio file to transcribe
echo "==> Speaking '${TEXT}'..."
npx voicebox-cli speak "${TEXT}" --profile "${FIRST_PROFILE_ID}" --output "${AUDIO_FILE}"

# Transcribe the generated audio file back to text
echo "==> Transcribing '${AUDIO_FILE}'..."
npx voicebox-cli transcribe "${AUDIO_FILE}"

# Confirm completion
echo "==> Done: transcribed ${AUDIO_FILE}"
