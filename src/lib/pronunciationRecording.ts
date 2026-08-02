import { Platform } from 'react-native';
import { Audio } from 'expo-av';

// Formato de grabación pensado para que Azure Pronunciation Assessment
// (endpoint de audio corto, tier gratuito) pueda decodificarlo. Confirmado
// contra el endpoint real de Azure:
//   - iOS: WAV/PCM 16kHz mono — probado en vivo, reconocimiento perfecto.
//   - Web: WAV/PCM 16kHz mono — igual que iOS, pero generado a mano con la
//     Web Audio API (ver webPcmRecorder.ts) en vez de expo-av. Antes se
//     grababa WebM/Opus (lo que expo-av produce por defecto en navegador),
//     pero Azure no lo decodificaba: llegaba con score 0 y "no dicha" en
//     todas las palabras, el mismo fallo ya visto con MP3 en este endpoint.
//   - Android: AMR-WB — expo-av NO puede grabar WAV/PCM crudo en Android
//     (MediaRecorder no lo soporta) ni WebM/Opus (el encoder Opus no está
//     expuesto en el enum de expo-av). AMR-WB es la opción más razonable
//     disponible (códec diseñado para voz), pero es la única que NO pude
//     verificar contra Azure en vivo — es el punto de mayor riesgo de este
//     feature y el primero a revisar si falla en un dispositivo Android real.
export const PRONUNCIATION_RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: false,
  android: {
    extension: '.amr',
    outputFormat: Audio.AndroidOutputFormat.AMR_WB,
    audioEncoder: Audio.AndroidAudioEncoder.AMR_WB,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 23850,
  },
  ios: {
    extension: '.wav',
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  // No se usa en la práctica: en web grabamos con WebPcmRecorder en vez de
  // expo-av (ver PronunciationRecorder), pero expo-av exige este campo.
  web: {
    mimeType: 'audio/webm;codecs=opus',
    bitsPerSecond: 128000,
  },
};

export function getRecordingContentType(): string {
  if (Platform.OS === 'android') return 'audio/amr-wb';
  return 'audio/wav; codecs=audio/pcm; samplerate=16000';
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
