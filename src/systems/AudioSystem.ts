import Phaser from 'phaser';
import { AudioSettings } from '../types/game';

export class AudioSystem {
  private static globalMusic?: Phaser.Sound.BaseSound;

  private readonly scene: Phaser.Scene;

  private settings: AudioSettings;

  constructor(scene: Phaser.Scene, settings: AudioSettings) {
    this.scene = scene;
    this.settings = settings;
  }

  applySettings(settings: AudioSettings): void {
    this.settings = settings;

    if (AudioSystem.globalMusic) {
      this.applyTrackMix(AudioSystem.globalMusic);
    }
  }

  playMusic(key: string, loop = true): void {
    if (AudioSystem.globalMusic && AudioSystem.globalMusic.key === key) {
      this.applyTrackMix(AudioSystem.globalMusic);
      return;
    }

    this.stopMusic();

    AudioSystem.globalMusic = this.scene.sound.add(key, {
      loop,
      volume: this.computeMusicVolume(),
      mute: this.settings.muted,
    });

    if (!AudioSystem.globalMusic.isPlaying) {
      AudioSystem.globalMusic.play();
    }
  }

  stopMusic(): void {
    if (!AudioSystem.globalMusic) {
      return;
    }

    AudioSystem.globalMusic.stop();
    AudioSystem.globalMusic.destroy();
    AudioSystem.globalMusic = undefined;
  }

  playSfx(key: string, volume = 1): void {
    if (!this.scene.cache.audio.exists(key)) {
      return;
    }
    this.scene.sound.play(key, {
      volume: this.computeSfxVolume() * Phaser.Math.Clamp(volume, 0, 1),
      mute: this.settings.muted,
    });
  }

  private computeMusicVolume(): number {
    return Phaser.Math.Clamp(this.settings.master, 0, 1) * Phaser.Math.Clamp(this.settings.music, 0, 1);
  }

  private computeSfxVolume(): number {
    return Phaser.Math.Clamp(this.settings.master, 0, 1) * Phaser.Math.Clamp(this.settings.sfx, 0, 1);
  }

  private applyTrackMix(track: Phaser.Sound.BaseSound): void {
    const sound = track as Phaser.Sound.BaseSound & {
      setVolume?: (volume: number) => void;
      setMute?: (mute: boolean) => void;
      volume?: number;
      mute?: boolean;
    };

    if (typeof sound.setVolume === 'function') {
      sound.setVolume(this.computeMusicVolume());
    } else {
      sound.volume = this.computeMusicVolume();
    }

    if (typeof sound.setMute === 'function') {
      sound.setMute(this.settings.muted);
    } else {
      sound.mute = this.settings.muted;
    }
  }

}
