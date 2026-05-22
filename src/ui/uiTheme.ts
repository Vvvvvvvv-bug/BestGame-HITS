export const UI_DEPTH = 1000;

export const UI_COLORS = {
  panel: 0x101722,
  panelAlt: 0x172234,
  tile: 0x1d2a3a,
  border: 0x7aa8c7,
  borderMuted: 0x31435a,
  selected: 0x8bd7ff,
  success: 0x79e6b2,
  warning: 0xffcf73,
  danger: 0xff6b7d,
  text: '#eef7ff',
  mutedText: '#9bb3c7',
} as const;

export const TEXT_STYLE = {
  fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
  color: UI_COLORS.text,
  resolution: 2,
} as const;

export function createHudPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  alpha = 0.9
): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(x, y, width, height, UI_COLORS.panel, alpha)
    .setStrokeStyle(1, UI_COLORS.borderMuted, 0.98)
    .setDepth(UI_DEPTH);
}
