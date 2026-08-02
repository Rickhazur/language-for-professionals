// Grabador de audio para navegador (Web Audio API) que produce WAV/PCM16
// mono a 16kHz real — el mismo formato ya verificado contra Azure en iOS.
// Necesario porque expo-av en web solo puede grabar vía MediaRecorder
// (WebM/Opus), y ese formato comprimido no lo decodifica el endpoint de
// Azure Pronunciation Assessment (confirmado: llega con score 0 y "no
// dicha" en todas las palabras — el mismo fallo que ya habíamos visto con
// MP3 en el endpoint de audio corto).
const TARGET_SAMPLE_RATE = 16000;

export class WebPcmRecorder {
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private chunks: Float32Array[] = [];

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
    const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioContext = new AudioContextCtor();
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    // ScriptProcessorNode está deprecado pero sigue soportado en todos los
    // navegadores actuales; evita la complejidad de cargar un AudioWorklet
    // como módulo aparte dentro del bundle de Metro/Expo.
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.chunks = [];

    this.processor.onaudioprocess = (event) => {
      this.chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  stop(): Blob {
    const sampleRate = this.audioContext?.sampleRate ?? TARGET_SAMPLE_RATE;
    this.cleanupNodes();

    const merged = mergeChunks(this.chunks);
    const resampled = sampleRate === TARGET_SAMPLE_RATE ? merged : downsample(merged, sampleRate, TARGET_SAMPLE_RATE);
    const wavBuffer = encodeWavPcm16(resampled, TARGET_SAMPLE_RATE);
    this.chunks = [];
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  cancel(): void {
    this.cleanupNodes();
    this.chunks = [];
  }

  private cleanupNodes(): void {
    this.processor?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.audioContext?.close().catch(() => {});
    this.processor = null;
    this.source = null;
    this.stream = null;
    this.audioContext = null;
  }
}

function mergeChunks(chunks: Float32Array[]): Float32Array {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Float32Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function downsample(buffer: Float32Array, inputRate: number, outputRate: number): Float32Array {
  const ratio = inputRate / outputRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < newLength) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accumulator = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accumulator += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accumulator / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

function encodeWavPcm16(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // tamaño del sub-chunk fmt
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits por muestra
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }

  return buffer;
}
