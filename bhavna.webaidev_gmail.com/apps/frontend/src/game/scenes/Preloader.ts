import Phaser from 'phaser';

export class Preloader extends Phaser.Scene {
  constructor() {
    super('Preloader');
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Loading bar background
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x111624, 0.8);
    progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 25, 320, 50, 8);
    progressBox.lineStyle(2, 0x3a4863, 1);
    progressBox.strokeRoundedRect(width / 2 - 160, height / 2 - 25, 320, 50, 8);

    // Loading text
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'INITIALIZING SYSTEMS...',
      style: {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '18px',
        color: '#00ffcc'
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    // Percentage text
    const percentText = this.make.text({
      x: width / 2,
      y: height / 2,
      text: '0%',
      style: {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '16px',
        color: '#ffffff'
      }
    });
    percentText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      percentText.setText(parseInt(String(value * 100)) + '%');
      progressBar.clear();
      progressBar.fillStyle(0x00ffcc, 1);
      progressBar.fillRoundedRect(width / 2 - 150, height / 2 - 15, 300 * value, 30, 4);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Load high-fidelity generated game assets
    this.load.image('ship', `${import.meta.env.BASE_URL}assets/ship.png`);
    this.load.image('asteroid', `${import.meta.env.BASE_URL}assets/asteroid.png`);
    this.load.image('cargo', `${import.meta.env.BASE_URL}assets/cargo.png`);
    this.load.image('fuel', `${import.meta.env.BASE_URL}assets/fuel.png`);
    this.load.image('power-shield', `${import.meta.env.BASE_URL}assets/power-shield.png`);
    this.load.image('power-magnet', `${import.meta.env.BASE_URL}assets/power-magnet.png`);
    this.load.image('power-double', `${import.meta.env.BASE_URL}assets/power-double.png`);
    this.load.image('power-slow', `${import.meta.env.BASE_URL}assets/power-slow.png`);
    this.load.image('data-cache', `${import.meta.env.BASE_URL}assets/data-cache.png`);
    this.load.image('mine', `${import.meta.env.BASE_URL}assets/mine.png`);
    this.load.image('debris', `${import.meta.env.BASE_URL}assets/debris.png`);

    // Keep the stars as generated graphics since they are just dots
    const starGraphics = this.add.graphics();
    starGraphics.fillStyle(0xffffff, 1);
    starGraphics.fillCircle(2, 2, 2);
    starGraphics.generateTexture('star', 4, 4);
    starGraphics.destroy();

    const dustGraphics = this.add.graphics();
    dustGraphics.fillStyle(0x5de8ff, 0.7);
    dustGraphics.fillRect(0, 0, 2, 18);
    dustGraphics.generateTexture('dust-streak', 2, 18);
    dustGraphics.destroy();





  }

  create() {
    this.scene.start('MainScene');
  }
}
