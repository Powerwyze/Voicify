'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { LandingSpec, LandingBlock } from '@/types/LandingSpec'
import { ANIMATION_PRESETS } from '@/utils/animation-presets'

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export function useGSAPTimeline(
  spec: LandingSpec,
  blockRefs: React.RefObject<(HTMLElement | null)[]>
) {
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    // Skip if animations disabled or no animation config
    if (!spec.animationConfig?.enabled) return

    // Skip if no blocks to animate
    if (!spec.blocks || spec.blocks.length === 0) return

    // Skip if prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      console.log('Animations disabled: prefers-reduced-motion')
      return
    }

    // Get refs to animated elements
    const elements = blockRefs.current
    if (!elements || elements.length === 0) return

    // Create master timeline
    const tl = gsap.timeline({
      paused: spec.animationConfig.timeline?.paused ?? false,
      repeat: spec.animationConfig.timeline?.repeat ?? 0,
      repeatDelay: spec.animationConfig.timeline?.repeatDelay ?? 0,
      yoyo: spec.animationConfig.timeline?.yoyo ?? false,
    })

    // Add animations for each block
    spec.blocks.forEach((block: LandingBlock, index: number) => {
      const element = elements[index]
      if (!element || !block.animation?.enabled) return

      const { animation } = block
      const trigger = animation.trigger || { type: 'onload' }

      // Get animation config (preset or custom)
      let animConfig
      if (animation.custom) {
        animConfig = animation.custom
      } else if (animation.preset) {
        const preset = ANIMATION_PRESETS[animation.preset]
        animConfig = {
          from: preset.from,
          to: preset.to,
        }
      } else {
        // Default fallback
        const preset = ANIMATION_PRESETS.fadeIn
        animConfig = {
          from: preset.from,
          to: preset.to,
        }
      }

      // Handle different trigger types
      if (trigger.type === 'onload') {
        // Animate on page load - add to master timeline
        gsap.set(element, animConfig.from || {})

        const toVars = { ...animConfig.to }

        // Handle orchestration mode
        const mode = spec.animationConfig?.orchestration?.mode ?? 'sequence'
        const staggerDelay = spec.animationConfig?.orchestration?.staggerDelay ?? 0.2

        if (mode === 'parallel') {
          // All animations start at the same time
          tl.to(element, toVars, 0)
        } else if (mode === 'stagger') {
          // Staggered with fixed delay
          tl.to(element, toVars, index * staggerDelay)
        } else {
          // Sequence mode (default) - one after another
          tl.to(element, toVars)
        }
      } else if (trigger.type === 'viewport') {
        // Animate when entering viewport using ScrollTrigger
        gsap.set(element, animConfig.from || {})

        const toVars = {
          ...animConfig.to,
          scrollTrigger: {
            trigger: element,
            start: `top ${(1 - (trigger.threshold ?? 0.3)) * 100}%`,
            once: trigger.once ?? true,
            toggleActions: 'play none none none',
            scrub: spec.animationConfig?.scrollTrigger?.scrub ?? false,
          }
        }

        gsap.to(element, toVars)
      } else if (trigger.type === 'scroll') {
        // Advanced scroll-based animation
        gsap.set(element, animConfig.from || {})

        const toVars = {
          ...animConfig.to,
          scrollTrigger: {
            trigger: element,
            start: 'top bottom',
            end: 'bottom top',
            scrub: spec.animationConfig?.scrollTrigger?.scrub ?? 1,
          }
        }

        gsap.to(element, toVars)
      }
    })

    // Play the timeline
    if (!spec.animationConfig.timeline?.paused) {
      tl.play()
    }

    timelineRef.current = tl

    // Cleanup
    return () => {
      tl.kill()
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [spec, blockRefs])

  return timelineRef
}
