export type Expression = 'default' | 'happy' | 'bored' | 'angry';
export type Orientation = 'straight' | 'left' | 'right';

export type FermiParams = {
  /**
   * Eyelid Y position in the eyelid's local animation space.
   * 0 = fully above pupils (open), 1 = covering top half of pupils (sleepy/bored/angry)
   */
  eyelidDrop: number;
  /**
   * Inward rotation of eyelids — 0 = level, 1 = full angry slant (±15°)
   */
  eyelidAngle: number;
  /** 0 = flat mouth nub, 1 = open smile arc */
  mouthOpen: number;
};

export const EXPRESSION_PARAMS: Record<Expression, FermiParams> = {
  default: { eyelidAngle: 0, eyelidDrop: 0, mouthOpen: 0 },
  happy: { eyelidAngle: 0, eyelidDrop: 0, mouthOpen: 1 },
  bored: { eyelidAngle: 0, eyelidDrop: 1, mouthOpen: 0 },
  angry: { eyelidAngle: 1, eyelidDrop: 1, mouthOpen: 0 },
};

/** Horizontal pixel shift applied to the antennas + eye group when looking left/right. */
export const ORIENTATION_X: Record<Orientation, number> = {
  straight: 0,
  left: -6,
  right: 6,
};
