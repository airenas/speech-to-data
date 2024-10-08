export default class PCM {
  sampleRate: number
  constructor (sampleRate: number) {
    this.sampleRate = sampleRate
  }

  floatTo16BitPCM (output: DataView, offset: number, input: Float32Array) {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]))
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
    }
  }

  writeData (output: DataView, offset: number, input: Float32Array) {
    for (let i = 0; i < input.length; i++, offset += 2) {
      output.setInt16(offset, input[i], true)
    }
  }

  writeString (view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  encodeWAV (samples: Float32Array): DataView {
    const buffer = new ArrayBuffer(44 + samples.length * 2)
    const view = new DataView(buffer)

    /* RIFF identifier */
    this.writeString(view, 0, 'RIFF')
    /* file length */
    view.setUint32(4, 32 + samples.length * 2, true)
    /* RIFF type */
    this.writeString(view, 8, 'WAVE')
    /* format chunk identifier */
    this.writeString(view, 12, 'fmt ')
    /* format chunk length */
    view.setUint32(16, 16, true)
    /* sample format (raw) */
    view.setUint16(20, 1, true)
    /* channel count */
    view.setUint16(22, 1, true)
    /* sample rate */
    view.setUint32(24, this.sampleRate, true)
    /* byte rate (sample rate * block align) */
    view.setUint32(28, this.sampleRate * 4, true)
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, 4, true)
    /* bits per sample */
    view.setUint16(34, 16, true)
    /* data chunk identifier */
    this.writeString(view, 36, 'data')
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true)

    this.writeData(view, 44, samples)

    return view
  }
}
