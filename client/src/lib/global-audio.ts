// Global audio instance to ensure only one track plays at a time
class GlobalAudio {
  private static instance: GlobalAudio;
  private audio: HTMLAudioElement;

  private constructor() {
    this.audio = new Audio();
  }

  static getInstance(): GlobalAudio {
    if (!GlobalAudio.instance) {
      GlobalAudio.instance = new GlobalAudio();
    }
    return GlobalAudio.instance;
  }

  getAudio(): HTMLAudioElement {
    return this.audio;
  }

  // Stop any current playback and load new track
  loadTrack(src: string): void {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.src = src;
    this.audio.load();
  }

  play(): Promise<void> {
    return this.audio.play();
  }

  pause(): void {
    this.audio.pause();
  }

  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
  }
}

export const globalAudio = GlobalAudio.getInstance();