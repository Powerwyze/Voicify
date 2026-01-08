'use client'

import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  Cpu,
  CreditCard,
  Languages,
  MessageSquare,
  QrCode,
  Smartphone,
  Sparkles,
  Zap,
} from 'lucide-react'

type Accent = 'cyan' | 'violet' | 'fuchsia' | 'slate'

function accentToTextClass(accent: Accent) {
  switch (accent) {
    case 'cyan':
      return 'text-cyan-400'
    case 'violet':
      return 'text-violet-400'
    case 'fuchsia':
      return 'text-fuchsia-400'
    default:
      return 'text-slate-300'
  }
}

function accentToBgClass(accent: Accent) {
  switch (accent) {
    case 'cyan':
      return 'bg-cyan-500/10'
    case 'violet':
      return 'bg-violet-500/10'
    case 'fuchsia':
      return 'bg-fuchsia-500/10'
    default:
      return 'bg-white/10'
  }
}

function accentToBorderHoverClass(accent: Accent) {
  switch (accent) {
    case 'cyan':
      return 'group-hover:border-cyan-500/40 hover:border-cyan-500/40'
    case 'violet':
      return 'group-hover:border-violet-500/40 hover:border-violet-500/40'
    case 'fuchsia':
      return 'group-hover:border-fuchsia-500/40 hover:border-fuchsia-500/40'
    default:
      return 'group-hover:border-white/20 hover:border-white/20'
  }
}

export default function LandingPage() {
  const heroRef = useRef<HTMLElement>(null)
  const heroSphereRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const journeyRef = useRef<HTMLElement>(null)
  const mobileRef = useRef<HTMLElement>(null)
  const pricingRef = useRef<HTMLElement>(null)
  const finalRef = useRef<HTMLElement>(null)

  const [activeTier, setActiveTier] = useState<number | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isGsapReady, setIsGsapReady] = useState(false)

  useEffect(() => {
    let isCancelled = false

    ;(async () => {
      const { ScrollTrigger } = await import('gsap/ScrollTrigger')
      gsap.registerPlugin(ScrollTrigger)
      if (!isCancelled) setIsGsapReady(true)
    })()

    setTimeout(() => setIsLoaded(true), 100)

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || !isGsapReady) return

    if (headlineRef.current) {
      const text = headlineRef.current.textContent || ''
      headlineRef.current.innerHTML = text
        .split('')
        .map(
          (char) =>
            `<span class="inline-block opacity-0" style="will-change: transform">${char === ' ' ? '&nbsp;' : char}</span>`
        )
        .join('')

      const chars = headlineRef.current.querySelectorAll('span')
      gsap.set(chars, { y: 50 })
      gsap.to(chars, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.015,
        ease: 'power4.out',
        delay: 0.15,
      })
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!heroSphereRef.current) return
      const rect = heroSphereRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const deltaX = (e.clientX - centerX) * 0.08
      const deltaY = (e.clientY - centerY) * 0.08

      gsap.to(heroSphereRef.current, {
        x: deltaX,
        y: deltaY,
        duration: 1.2,
        ease: 'power2.out',
      })
    }

    window.addEventListener('mousemove', handleMouseMove)

    const createParticles = () => {
      if (!heroRef.current) return
      for (let i = 0; i < 40; i++) {
        const particle = document.createElement('div')
        particle.className = 'absolute w-1 h-1 bg-cyan-400/40 rounded-full opacity-30'
        particle.style.left = `${Math.random() * 100}%`
        particle.style.top = `${60 + Math.random() * 40}%`
        heroRef.current.appendChild(particle)

        gsap.to(particle, {
          y: -180,
          opacity: 0,
          duration: 4 + Math.random() * 2,
          repeat: -1,
          delay: Math.random() * 3,
          ease: 'none',
        })
      }
    }

    createParticles()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isLoaded, isGsapReady])

  useEffect(() => {
    if (!isLoaded || !isGsapReady) return

    const sections = [journeyRef.current, mobileRef.current, pricingRef.current, finalRef.current].filter(Boolean) as HTMLElement[]
    for (const section of sections) {
      const items = section.querySelectorAll('[data-reveal]')
      gsap.from(items, {
        opacity: 0,
        y: 24,
        filter: 'blur(10px)',
        duration: 0.9,
        stagger: 0.08,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
        },
      })
    }

    ;(gsap as any).ScrollTrigger?.refresh?.()
  }, [isLoaded, isGsapReady])

  const steps: Array<{
    step: string
    title: string
    desc: string
    accent: Accent
    image: string
    icon: React.ReactNode
  }> = [
    {
      step: '01',
      title: 'Scan',
      desc: 'Scan a glowing QR code at any physical exhibit.',
      accent: 'cyan',
      image: '/assets/exhibits/museum-scan.jpg',
      icon: <QrCode size={24} />,
    },
    {
      step: '02',
      title: 'Pay',
      desc: 'Secure Stripe paywall for premium content.',
      accent: 'violet',
      image: '/assets/exhibits/paywall.jpg',
      icon: <CreditCard size={24} />,
    },
    {
      step: '03',
      title: 'Talk',
      desc: 'Conversational AI agent for that specific exhibit.',
      accent: 'fuchsia',
      image: '/assets/exhibits/live-call.jpg',
      icon: <MessageSquare size={24} />,
    },
  ]

  const tiers: Array<{
    tier: string
    name: string
    price: string
    desc: string
    features: string[]
    accent: Accent
    popular?: boolean
  }> = [
    {
      tier: 'I',
      name: 'Boutique',
      price: '$499',
      desc: 'Perfect for local galleries.',
      features: ['5 Agents', '1k Conversations', 'Basic Knowledge'],
      accent: 'slate',
    },
    {
      tier: 'II',
      name: 'Professional',
      price: '$1,299',
      desc: 'Standard for museums.',
      features: ['20 Agents', '10k Conversations', 'All Languages'],
      accent: 'cyan',
      popular: true,
    },
    {
      tier: 'III',
      name: 'Enterprise',
      price: 'Custom',
      desc: 'Unlimited scale for landmarks.',
      features: ['Unlimited Agents', 'Unlimited Convos', '3D Voice Identity'],
      accent: 'violet',
    },
  ]

  return (
    <div className="relative bg-[#020617] text-white overflow-x-hidden">
      <style jsx global>{`
        @keyframes cta-pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.35); }
          70% { box-shadow: 0 0 0 22px rgba(34, 211, 238, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0); }
        }
        .cta-glow-animate { animation: cta-pulse-glow 2s infinite; }

        @keyframes float-slow {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -10px, 0); }
        }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(1.05); }
        }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }

        @keyframes wave {
          0%, 100% { transform: scaleY(0.35); opacity: 0.65; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        .animate-wave { animation: wave 1.4s ease-in-out infinite; transform-origin: bottom; }
      `}</style>

      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/60 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-violet-600 rounded-lg" />
            <span className="text-xl font-black tracking-tighter">
              Voicify<span className="text-cyan-400">It</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:text-cyan-300 transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link href="/auth/signup">
              <button className="group bg-white text-black px-6 py-3 rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_40px_rgba(34,211,238,0.18)] flex items-center gap-2">
                Launch Live Demo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative h-screen flex items-center overflow-hidden pt-24">
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#020617] to-[#01040f]" />
        <div className="absolute inset-0 opacity-40 mix-blend-screen" style={{ backgroundImage: "url('/assets/backgrounds/neural-grid.png')", backgroundSize: 'cover' }} />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-cyan-500/10 blur-[120px]" />
        <div className="absolute -top-44 left-1/3 w-[900px] h-[900px] bg-violet-500/10 blur-[120px]" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center w-full relative z-10">
          <div className="space-y-10 z-20" data-reveal>
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-cyan-400 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
              <Sparkles size={14} />
              Intelligence for Physical Spaces
            </div>

            <h1 ref={headlineRef} className="text-6xl md:text-[5.5rem] font-extrabold tracking-tighter leading-[0.9] text-white">
              AI Voice Agents for Museums & Events
            </h1>

            <p className="text-xl text-slate-400 max-w-lg font-light leading-relaxed opacity-80">
              Deploy human-like curated voices that bring exhibits to life. Immersive, multilingual, and ready to converse.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-8 pt-4">
              <Link href="/visitor">
                <button className="group relative bg-white text-black px-12 py-6 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_50px_rgba(34,211,238,0.2)] flex items-center gap-3 overflow-hidden">
                  Launch Live Demo
                  <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                </button>
              </Link>

              <a
                href="#journey"
                className="bg-white/5 backdrop-blur-md border border-white/10 text-white/70 px-8 py-6 rounded-2xl font-bold hover:bg-white/10 transition-all text-sm uppercase tracking-widest"
              >
                Learn More
              </a>
            </div>
          </div>

          <div className="relative hidden lg:flex justify-center items-center h-full" data-reveal>
            <div className="relative w-[500px] h-[500px]">
              <div className="absolute inset-0 opacity-30 blur-[100px] bg-gradient-to-tr from-cyan-500 to-violet-500 animate-pulse-slow" />
              <div className="absolute inset-[-40px] rounded-full border border-white/5 animate-[spin_30s_linear_infinite]" />
              <div className="absolute inset-[-20px] rounded-full border border-cyan-500/10 animate-[spin_20s_linear_infinite_reverse]" />

              <div
                ref={heroSphereRef}
                className="relative z-10 w-full h-full rounded-full bg-white/5 backdrop-blur-xl flex items-center justify-center border border-white/10 overflow-hidden shadow-[inset_0_0_100px_rgba(255,255,255,0.05)]"
              >
                <div className="absolute inset-0">
                  <Image
                    src="/assets/hero/voice-sphere-3d.png"
                    alt="AI Voice Sphere"
                    fill
                    priority
                    sizes="500px"
                    className="object-cover opacity-80 mix-blend-screen"
                  />
                </div>

                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-violet-500/10 z-10 pointer-events-none" />

                <div className="relative flex items-center gap-2 h-32 z-20 pointer-events-none">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-gradient-to-t from-violet-600 to-cyan-400 rounded-full animate-wave"
                      style={{ animationDelay: `${i * 0.1}s`, animationDuration: `${1 + (i % 3) * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visitor Journey */}
      <section id="journey" ref={journeyRef} className="relative py-40 overflow-hidden">
        <div className="absolute inset-0 opacity-25 mix-blend-screen" style={{ backgroundImage: "url('/assets/backgrounds/neural-grid.png')", backgroundSize: 'cover' }} />

        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24 space-y-6" data-reveal>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight text-white">The Visitor Journey</h2>
            <p className="text-slate-500 font-light text-xl max-w-2xl mx-auto">Designed for physical worlds. Built for effortless exploration.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <StepCard key={s.step} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Experience */}
      <section ref={mobileRef} className="relative py-40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-12 order-2 lg:order-1" data-reveal>
            <div className="space-y-6">
              <h2 className="text-5xl font-black tracking-tight">The Mobile Experience</h2>
              <p className="text-slate-400 font-light text-xl leading-relaxed">
                This doesn&apos;t feel like a webpage — it feels like an extension of the exhibit itself.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <FeatureCard icon={<Cpu size={20} />} accent="cyan" title="AI-Spec Imagery" desc="Every agent features custom visuals that match the exhibit aesthetic." />
              <FeatureCard icon={<Languages size={20} />} accent="violet" title="Instant Multi-Language" desc="Detects visitor language for a localized experience." />
              <FeatureCard icon={<Zap size={20} />} accent="fuchsia" title="QR-First Flow" desc="Optimized for lightning-fast loading over venue Wi‑Fi." />
              <FeatureCard icon={<Smartphone size={20} />} accent="slate" title="No App Required" desc="Runs entirely in the browser using high-performance Web Audio." />
            </div>
          </div>

          <div className="relative order-1 lg:order-2 flex justify-center lg:justify-end" data-reveal>
            <div className="relative w-[320px] h-[640px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden animate-float-slow">
              <div className="absolute inset-0 bg-gradient-to-b from-[#020617] to-slate-900" />
              <div className="relative h-full flex flex-col p-6 pt-12 space-y-6">
                <div className="h-48 rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative">
                  <Image
                    src="/assets/exhibits/museum-scan.jpg"
                    alt="Exhibit hero"
                    fill
                    sizes="320px"
                    className="object-cover opacity-80"
                  />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-cyan-500/20 rounded-full" />
                  <div className="h-8 w-full bg-white/10 rounded-lg" />
                  <div className="h-24 w-full bg-white/5 rounded-xl" />
                </div>
                <div className="mt-auto pb-8">
                  <div className="w-full py-5 rounded-2xl bg-white text-black font-black text-center text-sm shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    Talk with Agent
                  </div>
                </div>
              </div>
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-800 rounded-full" />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-500/10 blur-[100px] -z-10" />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section ref={pricingRef} className="relative py-40 bg-[#020617]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 space-y-6" data-reveal>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight text-white">Choose Your Agent Tier</h2>
            <p className="text-slate-500 font-light text-xl max-w-2xl mx-auto">Tailored intelligence for any venue.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 group/pricing">
            {tiers.map((tier, idx) => (
              <PricingCard
                key={tier.tier}
                tier={tier.tier}
                name={tier.name}
                price={tier.price}
                desc={tier.desc}
                features={tier.features}
                accent={tier.accent}
                popular={tier.popular}
                index={idx}
                activeTier={activeTier}
                setActiveTier={setActiveTier}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section ref={finalRef} className="relative py-60 overflow-hidden flex items-center justify-center text-center">
        <div className="absolute inset-0 opacity-25 mix-blend-screen" style={{ backgroundImage: "url('/assets/backgrounds/neural-grid.png')", backgroundSize: 'cover' }} />

        <div className="max-w-4xl mx-auto px-6 space-y-16 relative z-10">
          <div className="relative group cursor-pointer inline-block" data-reveal>
            <div className="absolute inset-[-40px] bg-cyan-500/20 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="relative bg-white/5 border border-cyan-500/20 p-12 rounded-[3.5rem] shadow-[0_0_80px_rgba(34,211,238,0.1)] group-hover:scale-105 transition-transform duration-700">
              <div className="w-48 h-48 bg-[#020617] rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden">
                <div className="p-4 bg-white/5 rounded-2xl animate-pulse">
                  <QrCode size={120} className="text-cyan-400 opacity-60" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8" data-reveal>
            <h2 className="text-7xl md:text-[8rem] font-black tracking-tighter text-white leading-[0.8]">
              Let your
              <br />
              exhibits speak.
            </h2>
            <p className="text-slate-500 text-xl font-light">Join the future of cultural exploration.</p>
          </div>

          <div className="relative inline-block" data-reveal>
            <Link href="/auth/signup">
              <button className="group relative bg-white text-black px-16 py-8 rounded-3xl font-black text-2xl hover:bg-cyan-400 transition-all flex items-center gap-4 mx-auto shadow-2xl z-10 cta-glow-animate">
                Launch Experience <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-20 border-t border-white/5 bg-[#01040f]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-violet-600 rounded-lg" />
            <span className="text-xl font-black tracking-tighter">
              Voicify<span className="text-cyan-400">It</span>
            </span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-700">(c) 2025 Voicify It Systems</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  accent,
  title,
  desc,
}: {
  icon: React.ReactNode
  accent: Accent
  title: string
  desc: string
}) {
  return (
    <div className="space-y-4 p-6 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/5">
      <div className={`w-10 h-10 rounded-xl ${accentToBgClass(accent)} flex items-center justify-center ${accentToTextClass(accent)}`}>
        {icon}
      </div>
      <h4 className="font-bold text-lg">{title}</h4>
      <p className="text-slate-500 text-sm">{desc}</p>
    </div>
  )
}

function StepCard({
  icon,
  step,
  title,
  desc,
  image,
  accent,
}: {
  icon: React.ReactNode
  step: string
  title: string
  desc: string
  image: string
  accent: Accent
}) {
  return (
    <div
      className={`group bg-white/5 backdrop-blur-xl p-1 rounded-[2.5rem] border border-white/5 transition-all duration-500 hover:-translate-y-4 hover:bg-white/[0.07] ${accentToBorderHoverClass(accent)}`}
      data-reveal
    >
      <div className="p-8 space-y-8">
        <div className="relative aspect-[4/3] rounded-3xl bg-black/40 overflow-hidden border border-white/5">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            className="object-cover opacity-70 group-hover:opacity-85 group-hover:scale-105 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-80" />
          <div className={`absolute top-0 right-0 w-32 h-32 ${accentToBgClass(accent)} blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center transition-all ${accentToTextClass(accent)} group-hover:bg-white/10`}>
              {icon}
            </div>
            <span className="text-4xl font-black text-white/10 tracking-tighter">{step}</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white group-hover:translate-x-1 transition-transform">{title}</h3>
            <p className="text-slate-400 font-light leading-relaxed text-sm">{desc}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PricingCard({
  tier,
  name,
  price,
  desc,
  features,
  accent,
  popular,
  index,
  activeTier,
  setActiveTier,
}: {
  tier: string
  name: string
  price: string
  desc: string
  features: string[]
  accent: Accent
  popular?: boolean
  index: number
  activeTier: number | null
  setActiveTier: (i: number | null) => void
}) {
  const isActive = activeTier === null || activeTier === index
  return (
    <div
      onMouseEnter={() => setActiveTier(index)}
      onMouseLeave={() => setActiveTier(null)}
      className={[
        'relative group/card bg-white/5 backdrop-blur-xl rounded-[3rem] p-10 border transition-all duration-700',
        popular ? 'border-cyan-500/40' : 'border-white/5',
        'hover:scale-[1.05] hover:z-20 lg:group-hover/pricing:opacity-40 hover:!opacity-100 lg:group-hover/pricing:scale-95',
        isActive ? 'opacity-100' : 'opacity-40',
      ].join(' ')}
      data-reveal
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-[10px] font-black uppercase tracking-[0.2em] px-6 py-1.5 rounded-full shadow-lg shadow-cyan-500/40">
          Most Popular
        </div>
      )}

      <div className="relative flex flex-col items-center mb-10">
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          {popular && (
            <div className="absolute inset-[-40px] animate-[spin_10s_linear_infinite] pointer-events-none">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[8px] font-bold text-cyan-400/60 bg-black/40 px-2 rounded-full border border-cyan-500/20">
                EN
              </span>
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[8px] font-bold text-violet-400/60 bg-black/40 px-2 rounded-full border border-violet-500/20">
                ES
              </span>
            </div>
          )}
          <div className={`text-6xl font-black italic tracking-tighter animate-float-slow ${accentToTextClass(accent)}`}>
            {tier}
          </div>
        </div>
        <h3 className="text-3xl font-black text-white mb-2">{name}</h3>
        <p className="text-slate-500 text-sm mb-4">{desc}</p>
        <div className="flex items-baseline gap-1 text-white">
          <span className="text-4xl font-extrabold">{price === 'Custom' ? 'Custom' : price}</span>
          {price !== 'Custom' && <span className="text-slate-500 text-sm">/mo</span>}
        </div>
      </div>

      <div className="space-y-4 mb-10">
        {features.map((f, i) => (
          <div key={i} className="flex gap-3 items-center text-sm text-slate-300">
            <Check size={16} className={accentToTextClass(accent)} />
            {f}
          </div>
        ))}
      </div>

      <button
        className={[
          'w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all',
          popular ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20 hover:bg-white' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10',
        ].join(' ')}
      >
        Select Tier {tier}
      </button>
    </div>
  )
}
