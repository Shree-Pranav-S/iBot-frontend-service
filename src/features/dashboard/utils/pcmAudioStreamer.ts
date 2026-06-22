const DEFAULT_TARGET_SAMPLE_RATE = 16_000;
const DEFAULT_BUFFER_SIZE = 1024;
const DEFAULT_CHUNK_BYTES = 2560;

type AudioContextConstructor = typeof AudioContext;

declare global {
  interface Window {
    webkitAudioContext?: AudioContextConstructor;
  }
}

export interface PcmAudioStreamerOptions {
  onChunk: (chunk: ArrayBuffer) => void;
  shouldSend?: () => boolean;
  targetSampleRate?: number;
  bufferSize?: number;
  chunkBytes?: number;
}

export class PcmAudioStreamer {
  private readonly onChunk: (chunk: ArrayBuffer) => void;
  private readonly shouldSend: () => boolean;
  private readonly targetSampleRate: number;
  private readonly bufferSize: number;
  private readonly chunkBytes: number;

  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private silentGain: GainNode | null = null;
  private resampleRemainder = new Float32Array(0);
  private resampleCursor = 0;
  private pendingBytes = new Uint8Array(0);

  constructor(options: PcmAudioStreamerOptions) {
    this.onChunk = options.onChunk;
    this.shouldSend = options.shouldSend ?? (() => true);
    this.targetSampleRate = options.targetSampleRate ?? DEFAULT_TARGET_SAMPLE_RATE;
    this.bufferSize = options.bufferSize ?? DEFAULT_BUFFER_SIZE;
    this.chunkBytes = options.chunkBytes ?? DEFAULT_CHUNK_BYTES;
  }

  async start(): Promise<void> {
    if (this.audioContext) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextCtor) {
      stream.getTracks().forEach((track) => track.stop());
      throw new Error("Web Audio API is not supported in this browser.");
    }

    const audioContext = new AudioContextCtor({
      sampleRate: this.targetSampleRate,
    });

    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(this.bufferSize, 1, 1);
    const silentGain = audioContext.createGain();
    silentGain.gain.value = 0;

    processor.onaudioprocess = (event) => {
      if (!this.shouldSend()) {
        this.resetResampler();
        return;
      }

      const input = event.inputBuffer.getChannelData(0);
      const pcm = this.toLinear16(input, audioContext.sampleRate);
      if (pcm.byteLength > 0) {
        this.enqueuePcm(
          new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength),
        );
      }
    };

    source.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(audioContext.destination);

    this.stream = stream;
    this.audioContext = audioContext;
    this.source = source;
    this.processor = processor;
    this.silentGain = silentGain;
  }

  stop(): void {
    this.processor?.disconnect();
    this.source?.disconnect();
    this.silentGain?.disconnect();
    this.processor = null;
    this.source = null;
    this.silentGain = null;

    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;

    void this.audioContext?.close();
    this.audioContext = null;
    this.flushPendingBytes();
    this.resetResampler();
  }

  private resetResampler(): void {
    this.resampleRemainder = new Float32Array(0);
    this.resampleCursor = 0;
    this.pendingBytes = new Uint8Array(0);
  }

  private enqueuePcm(bytes: Uint8Array): void {
    const merged = new Uint8Array(this.pendingBytes.length + bytes.length);
    merged.set(this.pendingBytes);
    merged.set(bytes, this.pendingBytes.length);

    let offset = 0;
    while (offset + this.chunkBytes <= merged.length) {
      this.sendBytes(merged.subarray(offset, offset + this.chunkBytes));
      offset += this.chunkBytes;
    }

    this.pendingBytes = merged.slice(offset);
  }

  private flushPendingBytes(): void {
    if (this.pendingBytes.length > 0) {
      this.sendBytes(this.pendingBytes);
      this.pendingBytes = new Uint8Array(0);
    }
  }

  private sendBytes(bytes: Uint8Array): void {
    const chunk = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(chunk).set(bytes);
    this.onChunk(chunk);
  }

  private toLinear16(input: Float32Array, sourceSampleRate: number): Int16Array {
    const samples =
      sourceSampleRate === this.targetSampleRate
        ? input
        : this.resample(input, sourceSampleRate);

    const pcm = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    return pcm;
  }

  private resample(input: Float32Array, sourceSampleRate: number): Float32Array {
    const ratio = sourceSampleRate / this.targetSampleRate;
    const merged = new Float32Array(this.resampleRemainder.length + input.length);
    merged.set(this.resampleRemainder);
    merged.set(input, this.resampleRemainder.length);

    const output: number[] = [];
    let cursor = this.resampleCursor;

    while (cursor < merged.length - 1) {
      const index = Math.floor(cursor);
      const fraction = cursor - index;
      const sample = merged[index] + (merged[index + 1] - merged[index]) * fraction;
      output.push(sample);
      cursor += ratio;
    }

    const keepFrom = Math.max(0, Math.floor(cursor) - 1);
    this.resampleRemainder = merged.slice(keepFrom);
    this.resampleCursor = cursor - keepFrom;

    return Float32Array.from(output);
  }
}
