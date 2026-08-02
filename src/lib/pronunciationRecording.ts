import { Platform } from 'react-native';
import { Audio } from 'expo-av';

// Formato de grabación pensado para que Azure Pronunciation Assessment
// (endpoint de audio corto, tier gratuito) pueda decodificarlo. Confirmado
// contra el endpoint real de Azure:
//   - iOS: WAV/PCM 16kHz mono — probado en vivo, reconocimiento perfecto.
//   - Web: WebM/Opus — expo-av lo graba así por defecto en navegador;
//     coincide con un content-type documentado por Azure, no lo probé en
//     vivo desde este entorno (sin micrófono real disponible aquí).
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
  web: {
    mimeType: 'audio/webm;codecs=opus',
    bitsPerSecond: 128000,
  },
};

export function getRecordingContentType(): string {
  if (Platform.OS === 'ios') return 'audio/wav; codecs=audio/pcm; samplerate=16000';
  if (Platform.OS === 'android') return 'audio/amr-wb';
  return 'audio/webm; codecs=opus';
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
