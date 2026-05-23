import { TEXT_STYLE, UI_COLORS, UI_DEPTH } from './uiTheme';
import type { QuizQuestion } from '../quiz/questions';

const MODAL_DEPTH = UI_DEPTH + 20;
const QUIZ_DURATION = 15000; 
const PANEL_W = 560;
const PANEL_H = 440;
const BTN_W = 480;
const BTN_H = 50;
const TIMER_W = 480;
const LETTERS = ['A', 'B', 'C', 'D'];


export class QuizModal {
  private readonly scene: Phaser.Scene;
  private readonly onResolve: (correct: boolean) => void;
  private readonly question: QuizQuestion;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly buttons: { bg: Phaser.GameObjects.Rectangle; index: number }[] = [];
  private timerFill!: Phaser.GameObjects.Rectangle;
  private timerTween?: Phaser.Tweens.Tween;
  private resolveEvent?: Phaser.Time.TimerEvent;
  private answered = false;

  constructor(scene: Phaser.Scene, question: QuizQuestion, onResolve: (correct: boolean) => void) {
    this.scene = scene;
    this.question = question;
    this.onResolve = onResolve;

    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2;

    
    const backdrop = scene.add.rectangle(cx, cy, scene.scale.width, scene.scale.height, 0x05080f, 0.72)
      .setDepth(MODAL_DEPTH)
      .setInteractive();
    backdrop.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => e.stopPropagation());
    this.track(backdrop);

    
    this.track(
      scene.add.rectangle(cx, cy, PANEL_W, PANEL_H, 0x0f1a2c, 0.98)
        .setStrokeStyle(2, UI_COLORS.border)
        .setDepth(MODAL_DEPTH + 1)
    );

    
    this.track(
      scene.add.text(cx, cy - PANEL_H / 2 + 28, question.topic, {
        ...TEXT_STYLE,
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#7fe0ff',
        backgroundColor: '#16314a',
        padding: { x: 10, y: 4 },
      }).setOrigin(0.5).setDepth(MODAL_DEPTH + 2)
    );

    
    this.track(
      scene.add.text(cx, cy - PANEL_H / 2 + 78, question.question, {
        ...TEXT_STYLE,
        fontSize: '17px',
        fontStyle: 'bold',
        color: '#eef7ff',
        align: 'center',
        wordWrap: { width: PANEL_W - 60 },
      }).setOrigin(0.5, 0).setDepth(MODAL_DEPTH + 2)
    );

    
    const timerY = cy - 36;
    this.track(
      scene.add.rectangle(cx, timerY, TIMER_W, 8, 0x1b2a3f, 1)
        .setStrokeStyle(1, UI_COLORS.borderMuted)
        .setDepth(MODAL_DEPTH + 2)
    );
    this.timerFill = scene.add.rectangle(cx - TIMER_W / 2, timerY, TIMER_W, 8, 0xffcf73, 1)
      .setOrigin(0, 0.5)
      .setDepth(MODAL_DEPTH + 3);
    this.track(this.timerFill);

    
    const firstY = cy + 14;
    question.options.forEach((option, i) => {
      const by = firstY + i * (BTN_H + 10);

      const bg = scene.add.rectangle(cx, by, BTN_W, BTN_H, 0x1b2a3f, 0.98)
        .setStrokeStyle(1.5, UI_COLORS.borderMuted)
        .setDepth(MODAL_DEPTH + 2)
        .setInteractive({ useHandCursor: true });

      const text = scene.add.text(cx - BTN_W / 2 + 16, by, `${LETTERS[i]})  ${option}`, {
        ...TEXT_STYLE,
        fontSize: '14px',
        color: '#dbe9f7',
        wordWrap: { width: BTN_W - 32 },
      }).setOrigin(0, 0.5).setDepth(MODAL_DEPTH + 3);

      bg.on('pointerover', () => {
        if (!this.answered) bg.setStrokeStyle(2, UI_COLORS.selected);
      });
      bg.on('pointerout', () => {
        if (!this.answered) bg.setStrokeStyle(1.5, UI_COLORS.borderMuted);
      });
      bg.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
        e.stopPropagation();
        this.answer(i);
      });

      this.buttons.push({ bg, index: i });
      this.track(bg);
      this.track(text);
    });

    
    this.timerTween = scene.tweens.add({
      targets: this.timerFill,
      width: 0,
      duration: QUIZ_DURATION,
      ease: 'Linear',
      onComplete: () => this.answer(-1), 
    });
  }

  private answer(index: number): void {
    if (this.answered) return;
    this.answered = true;

    this.timerTween?.remove();

    const correct = index === this.question.correct;

    
    for (const { bg, index: bi } of this.buttons) {
      bg.disableInteractive();
      if (bi === this.question.correct) {
        bg.setFillStyle(0x1f4a33, 1).setStrokeStyle(2, 0x58d88f);
      } else if (bi === index) {
        bg.setFillStyle(0x4a1f29, 1).setStrokeStyle(2, 0xff6b7d);
      }
    }

    
    this.resolveEvent = this.scene.time.delayedCall(750, () => this.onResolve(correct));
  }

  
  public getObjects(): Phaser.GameObjects.GameObject[] {
    return this.objects;
  }

  public destroy(): void {
    this.timerTween?.remove();
    this.resolveEvent?.remove();
    for (const obj of this.objects) obj.destroy();
    this.objects.length = 0;
  }

  private track<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.objects.push(obj);
    return obj;
  }
}
