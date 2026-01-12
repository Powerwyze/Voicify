import gsap from 'gsap'

// Animation preset types
export type AnimationPreset =
  | 'fadeIn'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scaleIn'
  | 'rotateIn'
  | 'none'

// GSAP animation configuration
export interface GSAPAnimationConfig {
  from?: gsap.TweenVars
  to?: gsap.TweenVars
  position?: string | number
  duration?: number
  delay?: number
  ease?: string
  stagger?: number | {
    amount?: number
    from?: 'start' | 'center' | 'edges' | 'random' | number
    grid?: [number, number]
    axis?: 'x' | 'y'
    each?: number
  }
}

// Animation trigger configuration
export interface AnimationTrigger {
  type: 'onload' | 'scroll' | 'viewport'
  threshold?: number
  once?: boolean
}

// Block animation metadata
export interface BlockAnimation {
  preset?: AnimationPreset
  custom?: GSAPAnimationConfig
  trigger?: AnimationTrigger
  enabled?: boolean
}

// Global animation timeline configuration
export interface AnimationTimeline {
  enabled: boolean
  timeline?: {
    paused?: boolean
    repeat?: number
    repeatDelay?: number
    yoyo?: boolean
  }
  orchestration?: {
    mode: 'sequence' | 'stagger' | 'parallel'
    staggerDelay?: number
  }
  scrollTrigger?: {
    enabled: boolean
    smooth?: boolean
    scrub?: boolean | number
  }
}

// Block types with animation support
export type LandingBlock =
  | { id: string; type: 'paragraph'; text: string; animation?: BlockAnimation }
  | { id: string; type: 'bulletList'; items: string[]; animation?: BlockAnimation }
  | { id: string; type: 'cta'; label: string; href?: string; animation?: BlockAnimation }

// Landing page specification generated from owner descriptions via AI
export type LandingSpec = {
  version: 1;
  title: string; // e.g., "Champion Banyan Tree"
  subtitle?: string; // short line
  background?: {
    mode?: 'venue' | 'black' | 'upload' | 'ai';
    imageUrl?: string;
  };
  theme?: {
    primary?: string; // hex, default "#111827"
    background?: string; // hex, default "#FFFFFF"
    text?: string; // hex, default "#111827"
  };
  hero?: {
    imageUrl?: string; // optional
    overlay?: boolean; // darken image a bit
  };
  blocks: LandingBlock[];
  buttons?: {
    talkLabel?: string; // default "Talk with {AgentName}"
    scanAnotherLabel?: string; // default "Scan another QR"
  };
  languageHints?: string[]; // e.g., ["en","es"]
  animationConfig?: AnimationTimeline; // GSAP animation configuration
};
