import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AudioConvert } from '../src/misc/audio_convert.js';

function silenceWav(seconds = 0.1, sampleRate = 8000): Uint8Array {
	const numSamples = Math.floor(seconds * sampleRate);
	const dataSize = numSamples * 2;
	const buffer = new ArrayBuffer(44 + dataSize);
	const view = new DataView(buffer);

	const writeString = (offset: number, value: string): void => {
		for (let i = 0; i < value.length; i++) {
			view.setUint8(offset + i, value.charCodeAt(i));
		}
	};

	writeString(0, 'RIFF');
	view.setUint32(4, 36 + dataSize, true);
	writeString(8, 'WAVE');
	writeString(12, 'fmt ');
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, 1, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * 2, true);
	view.setUint16(32, 2, true);
	view.setUint16(34, 16, true);
	writeString(36, 'data');
	view.setUint32(40, dataSize, true);

	return new Uint8Array(buffer);
}

test('wavToMp3 produces valid mp3 bytes', async () => {
	const mp3 = await AudioConvert.wavToMp3(silenceWav(), '64k');

	assert.ok(mp3.byteLength > 0, 'expected non-empty mp3 output');

	const isId3 = mp3[0] === 0x49 && mp3[1] === 0x44 && mp3[2] === 0x33;
	const isFrameSync = mp3[0] === 0xff && (mp3[1] & 0xe0) === 0xe0;
	assert.ok(isId3 || isFrameSync, 'expected an ID3 tag or MPEG frame sync header');
});

test('toWav converts mp3 back to a RIFF/WAVE stream', async () => {
	const mp3 = await AudioConvert.wavToMp3(silenceWav(), '64k');
	const wav = await AudioConvert.toWav(mp3);

	assert.ok(wav.byteLength > 44, 'expected a non-empty wav output');
	const riff = String.fromCharCode(wav[0], wav[1], wav[2], wav[3]);
	const wave = String.fromCharCode(wav[8], wav[9], wav[10], wav[11]);
	assert.equal(riff, 'RIFF');
	assert.equal(wave, 'WAVE');
});
