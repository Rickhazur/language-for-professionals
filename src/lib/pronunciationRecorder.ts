import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { PRONUNCIATION_RECORDING_OPTIONS } from './pronunciationRecording';
import { WebPcmRecorder } from './webPcmRecorder';

// Abstrae la grabación para pronunciación detrás de start/stop -> URI,
// igual que expo-av, pero en web usa WebPcmRecorder (WAV/PCM real) en vez
// de expo-av (que en navegador solo puede grabar WebM/Opus, formato que
// Azure no decodifica). El resto de la app no necesita saber la diferencia.
export class PronunciationRecorder {
  private nativeRecording: Audio.Recording | null = null;
  private webRecorder: WebPcmRecorder | null = null;

  async start(): Promise<void> {
    if (Platform.OS === 'web') {
      const recorder = new WebPcmRecorder();
      await recorder.start();
      this.webRecorder = recorder;
      return;
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording } = await Audio.Recording.createAsync(PRONUNCIATION_RECORDING_OPTIONS);
    this.nativeRecording = recording;
  }

  async stop(): Promise<string> {
    if (this.webRecorder) {
      const blob = this.webRecorder.stop();
      this.webRecorder = null;
      return URL.createObjectURL(blob);
    }
    if (!this.nativeRecording) throw new Error('No hay una grabación en curso.');
    await this.nativeRecording.stopAndUnloadAsync();
    const uri = this.nativeRecording.getURI();
    this.nativeRecording = null;
    if (!uri) throw new Error('No se pudo obtener el archivo de audio.');
    return uri;
  }

  cancel(): void {
    this.nativeRecording?.stopAndUnloadAsync().catch(() => {});
    this.nativeRecording = null;
    this.webRecorder?.cancel();
    this.webRecorder = null;
  }
}
