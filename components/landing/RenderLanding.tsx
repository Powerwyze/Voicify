'use client'

import { useRef, useEffect } from 'react'
import { LandingSpec } from '@/types/LandingSpec'

type RenderLandingProps = {
  spec: LandingSpec
  agentName: string
  onTalkClick?: () => void
  onScanAnotherClick?: () => void
  isPreview?: boolean
  backgroundImage?: string
}

export default function RenderLanding({
  spec,
  agentName,
  onTalkClick,
  onScanAnotherClick,
  isPreview = false,
  backgroundImage,
}: RenderLandingProps) {
  const theme = {
    primary: spec.theme?.primary ?? '#111827',
    bg: spec.theme?.background ?? '#FFFFFF',
    text: spec.theme?.text ?? '#FFFFFF',
  }

  const talkLabel = spec.buttons?.talkLabel ?? `Talk with ${agentName}`
  const scanAnotherLabel = spec.buttons?.scanAnotherLabel ?? 'Scan another QR'

  // Refs for animated blocks (currently not used in mobile-first design)
  const blockRefsArray = useRef<(HTMLElement | null)[]>([])

  // Initialize GSAP timeline (only if blocks exist and animations are enabled)
  useEffect(() => {
    // Skip GSAP animations for the mobile-first landing page design
    // Animations are not needed since blocks are not displayed
    return
  }, [spec])

  // Update refs array when blocks change
  useEffect(() => {
    if (spec.blocks) {
      blockRefsArray.current = blockRefsArray.current.slice(0, spec.blocks.length)
    }
  }, [spec.blocks])

  console.log('RenderLanding spec:', spec)

  return (
    <div
      className={isPreview ? 'flex flex-col h-full relative overflow-hidden' : 'h-dvh flex flex-col relative overflow-hidden'}
    >
      {/* Background Image with Overlay */}
      {backgroundImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div className="absolute inset-0 bg-black/40" />
        </>
      )}

      {/* Content - Fixed to screen, no scroll */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header with Agent Name */}
        <div className="pt-6 px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
            {spec.title}
          </h1>
        </div>

        {/* Main Content - Centered */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4">
          {/* Hero Image in Center with Round Corners */}
          {spec.hero?.imageUrl && (
            <div className="relative w-full max-w-sm mb-0">
              <img
                src={spec.hero.imageUrl}
                alt={spec.title}
                className="w-full h-auto object-contain rounded-3xl shadow-2xl"
                style={{ maxHeight: '40vh' }}
              />

              {/* Talk Button Overlapping Bottom of Image */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-full px-6">
                <button
                  className="w-full px-8 py-4 rounded-2xl text-white text-xl font-bold shadow-2xl hover:shadow-xl transition-all hover:scale-105"
                  style={{ backgroundColor: theme.primary }}
                  onClick={onTalkClick}
                >
                  {talkLabel}
                </button>
              </div>
            </div>
          )}

          {/* If no hero image, show button normally */}
          {!spec.hero?.imageUrl && (
            <button
              className="px-8 py-4 rounded-2xl text-white text-xl font-bold shadow-2xl hover:shadow-xl transition-all hover:scale-105"
              style={{ backgroundColor: theme.primary }}
              onClick={onTalkClick}
            >
              {talkLabel}
            </button>
          )}
        </div>

        {/* Footer - Scan Another */}
        {!isPreview && (
          <div className="pb-6 px-4">
            <button
              className="w-full px-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/40 font-medium text-white hover:bg-white/30 transition-all"
              onClick={onScanAnotherClick}
            >
              {scanAnotherLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
