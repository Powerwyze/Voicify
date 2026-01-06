'use client'

import { forwardRef } from 'react'
import { LandingBlock } from '@/types/LandingSpec'

interface AnimatedBlockProps {
  block: LandingBlock
  className?: string
  style?: React.CSSProperties
}

const AnimatedBlock = forwardRef<HTMLDivElement, AnimatedBlockProps>(
  ({ block, className = '', style }, ref) => {
    // Render based on block type
    const renderContent = () => {
      switch (block.type) {
        case 'paragraph':
          return (
            <p className={`text-lg md:text-xl mb-6 ${className}`} style={style}>
              {block.text}
            </p>
          )

        case 'bulletList':
          return (
            <ul className={`text-left space-y-3 mb-6 ${className}`} style={style}>
              {block.items.map((item, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-3 mt-1.5 h-2 w-2 rounded-full bg-current flex-shrink-0" />
                  <span className="text-lg md:text-xl">{item}</span>
                </li>
              ))}
            </ul>
          )

        case 'cta':
          if (block.href) {
            return (
              <a
                href={block.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-block px-6 py-3 rounded-xl border-2 border-current font-semibold text-lg transition-all hover:bg-current hover:text-white ${className}`}
                style={style}
              >
                {block.label}
              </a>
            )
          }
          return (
            <button
              className={`px-6 py-3 rounded-xl border-2 border-current font-semibold text-lg transition-all hover:bg-current hover:text-white ${className}`}
              style={style}
            >
              {block.label}
            </button>
          )

        default:
          return null
      }
    }

    return (
      <div
        ref={ref}
        data-block-id={block.id}
        data-block-type={block.type}
        data-animation-preset={block.animation?.preset}
        data-animation-trigger={block.animation?.trigger?.type}
        data-animation-enabled={block.animation?.enabled}
        className="block-wrapper"
      >
        {renderContent()}
      </div>
    )
  }
)

AnimatedBlock.displayName = 'AnimatedBlock'

export default AnimatedBlock
