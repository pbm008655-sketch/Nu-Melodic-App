// Global audio manager to ensure only one audio source plays at a time
class AudioManager {
  private static instance: AudioManager;
  private currentAudio: HTMLAudioElement | null = null;
  private currentSource: string | null = null;
  private pauseCallbacks: Set<() => void> = new Set();

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  // Register a callback to be called when another audio source starts playing
  onPause(callback: () => void): () => void {
    this.pauseCallbacks.add(callback);
    // Return unsubscribe function
    return () => {
      this.pauseCallbacks.delete(callback);
    };
  }

  // Stop any currently playing audio and set a new one as active
  setActiveAudio(audio: HTMLAudioElement, source: string): void {
    // If this is already the active audio, do nothing
    if (this.currentAudio === audio && this.currentSource === source) {
      return;
    }

    // Stop the current audio if it exists and is different
    if (this.currentAudio && this.currentAudio !== audio) {
      try {
        if (!this.currentAudio.paused) {
          this.currentAudio.pause();
        }
      } catch (error) {
        console.warn('Error pausing previous audio:', error);
      }
    }

    // Notify all other audio sources to pause (but don't trigger for the current audio)
    this.pauseCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in pause callback:', error);
      }
    });

    // Set the new active audio
    this.currentAudio = audio;
    this.currentSource = source;
    console.log(`Audio manager: Set active audio to ${source}`);
  }

  // Clear the active audio when it stops
  clearActiveAudio(audio: HTMLAudioElement): void {
    if (this.currentAudio === audio) {
      this.currentAudio = null;
      this.currentSource = null;
    }
  }

  // Get current playing source for debugging
  getCurrentSource(): string | null {
    return this.currentSource;
  }

  // Force stop all audio
  stopAll(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }
    
    this.pauseCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in pause callback:', error);
      }
    });

    this.currentAudio = null;
    this.currentSource = null;
  }
}

export const audioManager = AudioManager.getInstance();