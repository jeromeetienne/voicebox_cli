#!/usr/bin/env bash
#
# end2end_generate_run.sh — generate a .wav saying "Hello world" using the first
# voice profile returned by the API.
#
# It lists the profiles, picks the first one, and runs `generate run` to
# synthesize the text into a WAV file.

# Exit on any error, undefined variable, or pipe failure
set -euo pipefail

# Change to the project root directory
cd "$(dirname "$0")/../.."

# Configuration
TEXT='Hello world, how are you today?'
AUDIO_FILE='outputs/end2end_generate_run.wav'

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

# Generate the WAV file using the selected profile
echo "==> Generating WAV for '${TEXT}'..."
npx voicebox-cli generate run "${FIRST_PROFILE_ID}" "${TEXT}" --output "${AUDIO_FILE}"

# Play the generated WAV file
echo "==> To play the generated WAV file, run:"
echo "afplay \"${AUDIO_FILE}\""

# Confirm completion
echo "==> Done: ${AUDIO_FILE}"
