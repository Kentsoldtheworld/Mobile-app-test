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
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
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
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

// ---------------------------------------------------------------------------
// Design tokens  (all coordinates for the inner 200×150 drawing space)
// The SVG viewBox is actually 200×158 with an 8 px top pad via <G translate>,
// giving antennas room to breathe without changing any coordinate values.
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

// ---------------------------------------------------------------------------
// Eyelid clip paths
//
// We clip the pupil circles using a parallelogram Path (not a rotated Rect).
// react-native-svg silently ignores `transform` strings on animated elements
// inside <ClipPath>, so rotation must be expressed as explicit coordinates.
//
// The clip window is a parallelogram whose top-left and top-right Y values
// differ by ±TILT_PX:
//   angry left eye  → outer corner DOWN (+tilt), inner corner UP (-tilt)
//   angry right eye → inner corner UP (-tilt),   outer corner DOWN (+tilt)
//
// clipPathUnits="userSpaceOnUse" resolves coords in the AnimatedG's LOCAL
// space, so Y_PAD and orientX are already absorbed — use eye coords as-is.
// ---------------------------------------------------------------------------
const Y_PAD = 8;              // static downward shift of all drawing content
const EYE_CLIP_DROP_PX = 8;   // px the clip top drops for bored/angry
const TILT_PX = 6;            // px of vertical tilt at full angry angle
const CLIP_BASE_Y = EYE_CY - PUPIL_R; // = 85  (full pupil visible when drop=0)
const EYE_CLIP_W = PUPIL_R * 2 + 6;   // 30 px — wider than pupil
const EYE_CLIP_H = PUPIL_R * 2 + 24;  // 48 px — tall enough to cover pupil

// Nose dots (inside Component1, face y≈102–114)
const NOSE_L_CX = 95;
const NOSE_R_CX = 105;
const NOSE_CY = 109;
const NOSE_R = 2;

// Mouth — Figma design: 32×16 container; flat nub at bottom-25% (4 px tall),
// smile extends to -75% below container (24 px tall).  Both are rounded rects
// with the same gradient (#2e3a59 top → rgba(46,58,89,0.8) bottom) and subtle
// top radii (2 px) that grow into a D-shape at the bottom when smiling.
const MOUTH_X = 84;
const MOUTH_Y = 116;
const MOUTH_W = 32;
const MOUTH_R_TOP = 2;       // fixed subtle top corner radius
const MOUTH_FLAT_H = 5;      // height when flat (pill)
const MOUTH_SMILE_H = 24;    // height when smiling — matches Figma 24 px depth
const MOUTH_FLAT_R_BOT = 2.5;  // bottom radius when flat → near-full pill
const MOUTH_SMILE_R_BOT = 16;  // = MOUTH_W/2 → pure semicircle bottom

// Antennas — widen the lean to match Figma's more dramatic angle
const R_ANT_BASE_X = 149;
const R_ANT_TIP_X = 174;
const L_ANT_BASE_X = 51;
const L_ANT_TIP_X = 26;
const ANT_BASE_Y = 36;
const ANT_TIP_Y = 4;
const ANT_BULB_R = 7;
const ANT_STEM_W = 5;

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
  // ViewBox: 200 wide × 158 tall (extra 8 px for antenna headroom)
  const VB_W = 200;
  const VB_H = 158;
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

  // Eyelid clip paths — expressed as parallelogram `d` strings so the tilt
  // is pure coordinate math (no transform needed).
  // eyelidAngle > 0 → inner corners UP   (sad)
  // eyelidAngle < 0 → inner corners DOWN (angry)
  const leftClipDProps = useAnimatedProps(() => {
    'worklet';
    const y = CLIP_BASE_Y + eyelidDrop.value * EYE_CLIP_DROP_PX;
    const tilt = eyelidAngle.value * TILT_PX;
    const x1 = L_EYE_CX - EYE_CLIP_W / 2; // outer left edge
    const x2 = L_EYE_CX + EYE_CLIP_W / 2; // inner right edge
    const h = EYE_CLIP_H;
    return {
      d: `M ${x1} ${y + tilt} L ${x2} ${y - tilt} L ${x2} ${y - tilt + h} L ${x1} ${y + tilt + h} Z`,
    };
  });

  const rightClipDProps = useAnimatedProps(() => {
    'worklet';
    const y = CLIP_BASE_Y + eyelidDrop.value * EYE_CLIP_DROP_PX;
    const tilt = eyelidAngle.value * TILT_PX;
    const x1 = R_EYE_CX - EYE_CLIP_W / 2; // inner left edge
    const x2 = R_EYE_CX + EYE_CLIP_W / 2; // outer right edge
    const h = EYE_CLIP_H;
    return {
      d: `M ${x1} ${y - tilt} L ${x2} ${y + tilt} L ${x2} ${y + tilt + h} L ${x1} ${y - tilt + h} Z`,
    };
  });

  // Mouth: single path morphing flat-pill → D-shape smile.
  // Both states are rounded-rects with the same command structure so the
  // path interpolates smoothly every frame without any crossfade artefacts.
  const mouthPathProps = useAnimatedProps(() => {
    'worklet';
    const t = mouthOpen.value;
    const h  = MOUTH_FLAT_H   + t * (MOUTH_SMILE_H   - MOUTH_FLAT_H);
    const rB = MOUTH_FLAT_R_BOT + t * (MOUTH_SMILE_R_BOT - MOUTH_FLAT_R_BOT);
    // SVG-correct clamping: adjacent radii on the same edge must sum ≤ edge length.
    // Top and bottom share the height axis, left/right share the width axis.
    const halfW = MOUTH_W / 2;
    const rTc = MOUTH_R_TOP < h / 2 ? MOUTH_R_TOP : h / 2;
    const rBc = rB < (h - rTc) ? (rB < halfW ? rB : halfW) : (h - rTc < halfW ? h - rTc : halfW);
    const x = MOUTH_X;
    const y = MOUTH_Y;
    const w = MOUTH_W;
    return {
      d: [
        `M ${x + rTc} ${y}`,
        `H ${x + w - rTc}`,
        `Q ${x + w} ${y} ${x + w} ${y + rTc}`,
        `V ${y + h - rBc}`,
        `Q ${x + w} ${y + h} ${x + w - rBc} ${y + h}`,
        `H ${x + rBc}`,
        `Q ${x} ${y + h} ${x} ${y + h - rBc}`,
        `V ${y + rTc}`,
        `Q ${x} ${y} ${x + rTc} ${y}`,
        'Z',
      ].join(' '),
    };
  });

  return (
    <View style={{ width: size, height }}>
      <Svg
        width={size}
        height={height}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
      >
        <Defs>
          {/* Head sphere gradient */}
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

          {/* Mouth gradient — matches Figma: dark navy top → slightly
              transparent bottom, giving the pill/D-shape subtle depth.
              objectBoundingBox means it auto-scales as the mouth morphs. */}
          <LinearGradient id="mouthGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#2E3A59" stopOpacity="1" />
            <Stop offset="1" stopColor="#2E3A59" stopOpacity="0.8" />
          </LinearGradient>

          {/* ── Eyelid clip paths ───────────────────────────────────────
              Each ClipPath holds an AnimatedPath whose `d` draws a
              parallelogram.  The top edge tilts for angry (inner corner up,
              outer corner down) without any SVG transform — RN-SVG ignores
              transform strings on animated elements inside <Defs>.
          ─────────────────────────────────────────────────────────────── */}
          <ClipPath id="lEyeClip">
            <AnimatedPath animatedProps={leftClipDProps} />
          </ClipPath>
          <ClipPath id="rEyeClip">
            <AnimatedPath animatedProps={rightClipDProps} />
          </ClipPath>
        </Defs>

        {/* Shift all drawing content down by Y_PAD so antenna tips
            have breathing room above y=0.                            */}
        <G transform={`translate(0 ${Y_PAD})`}>

          {/* ── Ears (behind head) ───────────────────────────────────── */}
          <Path
            d="M 153 90 L 165 110 L 179 102 A 24 24 0 0 0 187 70 Z"
            fill={BODY}
          />
          <Path
            d="M 153 90 L 165 110 L 179 102 A 24 24 0 0 0 187 70 Z"
            fill="rgba(143,155,179,0.16)"
            stroke={BODY}
            strokeWidth={3}
          />
          <Path
            d="M 47 90 L 35 110 L 21 102 A 24 24 0 0 1 13 70 Z"
            fill={BODY}
          />
          <Path
            d="M 47 90 L 35 110 L 21 102 A 24 24 0 0 1 13 70 Z"
            fill="rgba(143,155,179,0.16)"
            stroke={BODY}
            strokeWidth={3}
          />

          {/* ── Head sphere ──────────────────────────────────────────── */}
          <Ellipse
            cx={HEAD_CX}
            cy={HEAD_CY}
            rx={HEAD_R}
            ry={HEAD_R}
            fill="url(#headGrad)"
          />

          {/* ── Face internals (shift with orientation) ───────────────── */}
          <AnimatedG animatedProps={faceGroupProps}>

            {/* Antennas */}
            <Path
              d={`M ${R_ANT_BASE_X} ${ANT_BASE_Y} L ${R_ANT_TIP_X} ${ANT_TIP_Y}`}
              stroke="#72D9A5"
              strokeWidth={ANT_STEM_W}
              strokeLinecap="round"
            />
            <Circle cx={R_ANT_TIP_X} cy={ANT_TIP_Y} r={ANT_BULB_R} fill="url(#antGrad)" />
            <Path
              d={`M ${L_ANT_BASE_X} ${ANT_BASE_Y} L ${L_ANT_TIP_X} ${ANT_TIP_Y}`}
              stroke="#72D9A5"
              strokeWidth={ANT_STEM_W}
              strokeLinecap="round"
            />
            <Circle cx={L_ANT_TIP_X} cy={ANT_TIP_Y} r={ANT_BULB_R} fill="url(#antGrad)" />

            {/* ── Pupils — clipped by eyelid clip paths ──────────────── */}
            <Circle
              cx={L_EYE_CX}
              cy={EYE_CY}
              r={PUPIL_R}
              fill={DARK}
              clipPath="url(#lEyeClip)"
            />
            <Circle
              cx={L_EYE_CX - 3}
              cy={EYE_CY - 4}
              r={4}
              fill={HIGHLIGHT}
              clipPath="url(#lEyeClip)"
            />
            <Circle
              cx={R_EYE_CX}
              cy={EYE_CY}
              r={PUPIL_R}
              fill={DARK}
              clipPath="url(#rEyeClip)"
            />
            <Circle
              cx={R_EYE_CX - 3}
              cy={EYE_CY - 4}
              r={4}
              fill={HIGHLIGHT}
              clipPath="url(#rEyeClip)"
            />

            {/* ── Nose dots ─────────────────────────────────────────── */}
            <Circle cx={NOSE_L_CX} cy={NOSE_CY} r={NOSE_R} fill={DARK} opacity={0.55} />
            <Circle cx={NOSE_R_CX} cy={NOSE_CY} r={NOSE_R} fill={DARK} opacity={0.55} />

            {/* ── Mouth — single morphing rounded-rect path ─────────── */}
            <AnimatedPath
              animatedProps={mouthPathProps}
              fill="url(#mouthGrad)"
            />

          </AnimatedG>
        </G>
      </Svg>
    </View>
  );
}
