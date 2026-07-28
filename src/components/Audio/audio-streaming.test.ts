import { describe, expect, it } from 'vitest';

import { DEFAULT_AUDIO_BUFFER_SEC, getWorkletBufferSize } from './audio-streaming';

describe('getWorkletBufferSize', () => {
  it('uses a smaller default chunk size for faster streaming', () => {
    expect(DEFAULT_AUDIO_BUFFER_SEC).toBe(0.05);
    expect(getWorkletBufferSize(16000)).toBe(62);
  });

  it('keeps the size at least one frame', () => {
    expect(getWorkletBufferSize(8000, 0.001)).toBe(1);
  });
});
