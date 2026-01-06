import gsap from 'gsap'

export type AnimationPreset =
  | 'fadeIn'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scaleIn'
  | 'rotateIn'
  | 'none'

export interface GSAPPresetConfig {
  from: gsap.TweenVars
  to: gsap.TweenVars
}

export const ANIMATION_PRESETS: Record<AnimationPreset, GSAPPresetConfig> = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1, duration: 0.8, ease: 'power2.out' }
  },
  slideUp: {
    from: { opacity: 0, y: 60 },
    to: { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
  },
  slideDown: {
    from: { opacity: 0, y: -60 },
    to: { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
  },
  slideLeft: {
    from: { opacity: 0, x: 60 },
    to: { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }
  },
  slideRight: {
    from: { opacity: 0, x: -60 },
    to: { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }
  },
  scaleIn: {
    from: { opacity: 0, scale: 0.8 },
    to: { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.4)' }
  },
  rotateIn: {
    from: { opacity: 0, rotation: -10, scale: 0.95 },
    to: { opacity: 1, rotation: 0, scale: 1, duration: 0.8, ease: 'power2.out' }
  },
  none: {
    from: {},
    to: { duration: 0 }
  }
}

export function getPresetAnimation(preset: AnimationPreset): GSAPPresetConfig {
  return ANIMATION_PRESETS[preset] || ANIMATION_PRESETS.fadeIn
}
