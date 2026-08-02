import { Audio } from 'expo-av';

export async function playAudioUri(uri: string): Promise<void> {
  const { sound } = await Audio.Sound.createAsync({ uri });
  return new Promise((resolve) => {
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
        resolve();
      }
    });
    sound.playAsync();
  });
}
