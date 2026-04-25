import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  Circle,
  Defs,
  Ellipse,
  G,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Svg,
} from 'react-native-svg';

import {
  EXPRESSION_PARAMS,
  ORIENTATION_X,
  type Expression,
  type Orientation,
} from './expressions';

// ---------------------------------------------------------------------------
// Animated SVG primitives
// ---------------------------------------------------------------------------
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

// ---------------------------------------------------------------------------
// Design tokens  (all coordinates for viewBox="0 0 200 150")
// Derived from Figma canvas 197.641 × 148 px — exact inset percentages.
// ---------------------------------------------------------------------------
const BODY = '#ADFFCF';
const DARK = '#222B45';
const HIGHLIGHT = '#EDF1F7';

// Head — perfect circle (Figma: 144×144 px container)
const HEAD_CX = 100;
const HEAD_CY = 77;
const HEAD_R = 73;

// Pupils — 24×24 px ball in Figma, r=12 each
const L_EYE_CX = 64;
const R_EYE_CX = 137;
const EYE_CY = 97;
const PUPIL_R = 12;

// Eyelid rectangles (body-coloured, slide down over pupil tops)
// In Figma the eyes container is 104×32, each eyelid is 32×16 px.
// "Open"  (Variant3): top at face y=68 → SVG y=69  (just above pupil top y≈85)
// "Droopy" (Default): top at face y=76 → SVG y=77  (covers top 8 px of pupil)
const EYELID_W = 32;
const EYELID_H = 16;
const L_EYELID_X = 48;     // left-edge of left eyelid rect
const R_EYELID_X = 120;    // left-edge of right eyelid rect
const L_EYELID_PIVOT = 64; // rotation centre x for left eyelid
const R_EYELID_PIVOT = 137;// rotation centre x for right eyelid
const EYELID_OPEN_Y = 69;  // y when fully open  (drop=0)
const EYELID_DROP_PX = 8;  // total pixels to drop (open→droopy)

// Nose dots (imgGroup10 inside Component1, face y≈102–114)
const NOSE_L_CX = 95;
const NOSE_R_CX = 105;
const NOSE_CY = 109;
const NOSE_R = 2;

// Mouth nub (Component1 "Default" — face y=114–118, x=83–115)
const MOUTH_X = 84;
const MOUTH_Y = 116;
const MOUTH_W = 32;
const MOUTH_H = 5;
// Smile arc path (happy variant — open D-shape)
const SMILE_D = 'M 84 116 Q 100 134 116 116 Z';

// Antennas — 43.8×43.8 container in Figma, centres at (161,22) and (37,22)
const R_ANT_BASE_X = 160;
const R_ANT_TIP_X = 163;
const L_ANT_BASE_X = 40;
const L_ANT_TIP_X = 37;
const ANT_BASE_Y = 35;
const ANT_TIP_Y = 5;
const ANT_BULB_R = 5;
const ANT_STEM_W = 4;

// Easing shared across all transitions
const ANIM = { duration: 260, easing: Easing.out(Easing.cubic) } as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export type FermiProps = {
  expression?: Expression;
  orientation?: Orientation;
  size?: number;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function Fermi({
  expression = 'default',
  orientation = 'straight',
  size = 200,
}: FermiProps) {
  const VB_W = 200;
  const VB_H = 150;
  const height = size * (VB_H / VB_W);

  // Shared animation values
  const eyelidDrop = useSharedValue(0);
  const eyelidAngle = useSharedValue(0);
  const mouthOpen = useSharedValue(0);
  const orientX = useSharedValue(0);

  useEffect(() => {
    const params = EXPRESSION_PARAMS[expression];
    eyelidDrop.value = withTiming(params.eyelidDrop, ANIM);
    eyelidAngle.value = withTiming(params.eyelidAngle, ANIM);
    mouthOpen.value = withTiming(params.mouthOpen, ANIM);
  }, [expression]);

  useEffect(() => {
    orientX.value = withTiming(ORIENTATION_X[orientation], ANIM);
  }, [orientation]);

  // --- Animated props ---

  // Entire face internals shift left/right for orientation
  const faceGroupProps = useAnimatedProps(() => ({
    transform: `translate(${orientX.value} 0)`,
  }));

  // Left eyelid: slides down and (for angry) rotates inward.
  // Pivot uses LOCAL coords (inside the translated face group) — no orientX offset needed.
  const leftEyelidProps = useAnimatedProps(() => {
    'worklet';
    const y = EYELID_OPEN_Y + eyelidDrop.value * EYELID_DROP_PX;
    const pivotY = y + EYELID_H / 2;
    const angle = eyelidAngle.value * 15;
    return {
      y,
      transform: `rotate(${angle} ${L_EYELID_PIVOT} ${pivotY})`,
    };
  });

  // Right eyelid: same drop, opposite rotation
  const rightEyelidProps = useAnimatedProps(() => {
    'worklet';
    const y = EYELID_OPEN_Y + eyelidDrop.value * EYELID_DROP_PX;
    const pivotY = y + EYELID_H / 2;
    const angle = -eyelidAngle.value * 15;
    return {
      y,
      transform: `rotate(${angle} ${R_EYELID_PIVOT} ${pivotY})`,
    };
  });

  // Mouth: crossfade flat ↔ smile
  const flatMouthProps = useAnimatedProps(() => ({
    opacity: 1 - mouthOpen.value,
  }));

  const smileMouthProps = useAnimatedProps(() => ({
    opacity: mouthOpen.value,
  }));

  return (
    <View style={{ width: size, height }}>
      <Svg
        width={size}
        height={height}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
      >
        <Defs>
          {/* Head sphere gradient — light mint top-centre, darker green bottom */}
          <RadialGradient id="headGrad" cx="42%" cy="32%" r="68%">
            <Stop offset="0%" stopColor="#E0FFF2" />
            <Stop offset="55%" stopColor="#ADFFCF" />
            <Stop offset="100%" stopColor="#5CBFA0" />
          </RadialGradient>
          {/* Antenna gradient */}
          <RadialGradient id="antGrad" cx="40%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="#C8FFDF" />
            <Stop offset="100%" stopColor="#72D9A5" />
          </RadialGradient>
        </Defs>

        {/* ── Ears (drawn behind head) ────────────────────────────────── */}
        {/*
          Each ear is a 24×40 rect with rounded-tr-24, rotated 60°,
          centred at right=(176,90) / left=(24,90).
          Rotated path points (right):
            BL=(153,90)  BR=(165,110)  arc-start=(179,102)  tip=(187,70)
          Left is mirrored (sweep flag 1).
        */}
        {/* Right ear — fill */}
        <Path
          d="M 153 90 L 165 110 L 179 102 A 24 24 0 0 0 187 70 Z"
          fill={BODY}
        />
        {/* Right ear — border overlay */}
        <Path
          d="M 153 90 L 165 110 L 179 102 A 24 24 0 0 0 187 70 Z"
          fill="rgba(143,155,179,0.16)"
          stroke={BODY}
          strokeWidth={3}
        />
        {/* Left ear — fill */}
        <Path
          d="M 47 90 L 35 110 L 21 102 A 24 24 0 0 1 13 70 Z"
          fill={BODY}
        />
        {/* Left ear — border overlay */}
        <Path
          d="M 47 90 L 35 110 L 21 102 A 24 24 0 0 1 13 70 Z"
          fill="rgba(143,155,179,0.16)"
          stroke={BODY}
          strokeWidth={3}
        />

        {/* ── Head sphere ─────────────────────────────────────────────── */}
        <Ellipse
          cx={HEAD_CX}
          cy={HEAD_CY}
          rx={HEAD_R}
          ry={HEAD_R}
          fill="url(#headGrad)"
        />

        {/* ── Face internals (shift with orientation) ──────────────────── */}
        <AnimatedG animatedProps={faceGroupProps}>

          {/* Antennas */}
          {/* Right antenna stem */}
          <Path
            d={`M ${R_ANT_BASE_X} ${ANT_BASE_Y} L ${R_ANT_TIP_X} ${ANT_TIP_Y}`}
            stroke="#72D9A5"
            strokeWidth={ANT_STEM_W}
            strokeLinecap="round"
          />
          {/* Right antenna bulb */}
          <Circle
            cx={R_ANT_TIP_X}
            cy={ANT_TIP_Y}
            r={ANT_BULB_R}
            fill="url(#antGrad)"
          />
          {/* Left antenna stem */}
          <Path
            d={`M ${L_ANT_BASE_X} ${ANT_BASE_Y} L ${L_ANT_TIP_X} ${ANT_TIP_Y}`}
            stroke="#72D9A5"
            strokeWidth={ANT_STEM_W}
            strokeLinecap="round"
          />
          {/* Left antenna bulb */}
          <Circle
            cx={L_ANT_TIP_X}
            cy={ANT_TIP_Y}
            r={ANT_BULB_R}
            fill="url(#antGrad)"
          />

          {/* ── Pupils ─────────────────────────────────────────────────── */}
          {/* Left pupil */}
          <Circle cx={L_EYE_CX} cy={EYE_CY} r={PUPIL_R} fill={DARK} />
          {/* Left pupil highlight */}
          <Circle cx={L_EYE_CX - 3} cy={EYE_CY - 4} r={3} fill={HIGHLIGHT} />
          {/* Right pupil */}
          <Circle cx={R_EYE_CX} cy={EYE_CY} r={PUPIL_R} fill={DARK} />
          {/* Right pupil highlight */}
          <Circle cx={R_EYE_CX - 3} cy={EYE_CY - 4} r={3} fill={HIGHLIGHT} />

          {/* ── Eyelids (body-coloured, cover tops of pupils) ──────────── */}
          <AnimatedRect
            animatedProps={leftEyelidProps}
            x={L_EYELID_X}
            width={EYELID_W}
            height={EYELID_H}
            fill={BODY}
            rx={3}
          />
          <AnimatedRect
            animatedProps={rightEyelidProps}
            x={R_EYELID_X}
            width={EYELID_W}
            height={EYELID_H}
            fill={BODY}
            rx={3}
          />

          {/* ── Nose dots ──────────────────────────────────────────────── */}
          <Circle cx={NOSE_L_CX} cy={NOSE_CY} r={NOSE_R} fill={DARK} opacity={0.55} />
          <Circle cx={NOSE_R_CX} cy={NOSE_CY} r={NOSE_R} fill={DARK} opacity={0.55} />

          {/* ── Mouth ──────────────────────────────────────────────────── */}
          {/* Flat nub (default / bored / angry) */}
          <AnimatedRect
            animatedProps={flatMouthProps}
            x={MOUTH_X}
            y={MOUTH_Y}
            width={MOUTH_W}
            height={MOUTH_H}
            rx={3}
            fill={DARK}
          />
          {/* Open smile (happy) */}
          <AnimatedPath
            animatedProps={smileMouthProps}
            d={SMILE_D}
            fill={DARK}
          />

        </AnimatedG>
      </Svg>
    </View>
  );
}
