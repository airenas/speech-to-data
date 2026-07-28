export const DEFAULT_AUDIO_BUFFER_SEC = 0.10;

export const getWorkletBufferSize = (
  sampleRate: number,
  bufferInSec = DEFAULT_AUDIO_BUFFER_SEC,
) => Math.max(1, Math.round((sampleRate / 128) * bufferInSec));
