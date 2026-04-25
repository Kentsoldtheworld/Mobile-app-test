export type Expression = 'default' | 'happy' | 'bored' | 'sad' | 'angry';
export type Orientation = 'straight' | 'left' | 'right';

export type FermiParams = {
  /**
   * Eyelid drop amount. 0 = pupils fully open, 1 = top ~1/3 of pupil hidden.
   */
  eyelidDrop: number;
  /**
   * Eyelid tilt.
   *  0  = level
   * +1  = inner corners UP, outer corners DOWN  → sad
   * -1  = inner corners DOWN, outer corners UP  → angry
   */
  eyelidAngle: number;
  /** 0 = flat mouth nub, 1 = open smile arc */
  mouthOpen: number;
};

export const EXPRESSION_PARAMS: Record<Expression, FermiParams> = {
  default: { eyelidAngle:  0, eyelidDrop: 0, mouthOpen: 0 },
  happy:   { eyelidAngle:  0, eyelidDrop: 0, mouthOpen: 1 },
  bored:   { eyelidAngle:  0, eyelidDrop: 1, mouthOpen: 0 },
  sad:     { eyelidAngle:  1, eyelidDrop: 1, mouthOpen: 0 }, // inner corners UP
  angry:   { eyelidAngle: -1, eyelidDrop: 1, mouthOpen: 0 }, // inner corners DOWN
};

/** Horizontal pixel shift applied to the antennas + eye group when looking left/right. */
export const ORIENTATION_X: Record<Orientation, number> = {
  straight: 0,
  left: -6,
  right: 6,
};
