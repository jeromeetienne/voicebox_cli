import { spawn } from 'node:child_process';
import ffmpegStatic from 'ffmpeg-static';

/** Path to the bundled ffmpeg binary, or `null` if none ships for this platform. */
const ffmpegPath = ffmpegStatic as unknown as string | null;

/** Audio transcoding helpers backed by the bundled `ffmpeg-static` binary. */
export class AudioConvert {
	/**
	 * Transcode WAV audio to MP3 using the bundled ffmpeg binary.
	 *
	 * The WAV bytes are piped to ffmpeg's stdin and the encoded MP3 is read
	 * back from stdout, so nothing touches the filesystem.
	 *
	 * @param wav Raw WAV audio bytes.
	 * @param bitrate Target MP3 bitrate (e.g. `'192k'`).
	 * @returns The encoded MP3 bytes.
	 * @throws If no ffmpeg binary is available or ffmpeg exits non-zero.
	 */
	static async wavToMp3(wav: Uint8Array, bitrate = '192k'): Promise<Uint8Array> {
		if (ffmpegPath === null) {
			throw new Error('ffmpeg-static did not provide a binary for this platform');
		}

		return await new Promise((resolve, reject) => {
			const ffmpeg = spawn(ffmpegPath, [
				'-hide_banner',
				'-loglevel', 'error',
				'-f', 'wav',
				'-i', 'pipe:0',
				'-codec:a', 'libmp3lame',
				'-b:a', bitrate,
				'-f', 'mp3',
				'pipe:1',
			]);

			const chunks: Uint8Array[] = [];
			let stderr = '';

			ffmpeg.stdout.on('data', (chunk: Uint8Array) => chunks.push(chunk));
			ffmpeg.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
			ffmpeg.on('error', reject);
			ffmpeg.on('close', (code) => {
				if (code !== 0) {
					reject(new Error(`ffmpeg exited with code ${code}: ${stderr.trim()}`));
					return;
				}
				resolve(new Uint8Array(Buffer.concat(chunks)));
			});

			ffmpeg.stdin.write(wav);
			ffmpeg.stdin.end();
		});
	}
}
