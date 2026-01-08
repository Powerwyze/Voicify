'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import Lenis from 'lenis'
import Link from 'next/link'
import Image from 'next/image'

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const sphereRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const scannerRef = useRef<HTMLDivElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<HTMLDivElement>(null)
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

    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    // Mark as loaded after a brief delay
    setTimeout(() => setIsLoaded(true), 100)

    return () => {
      isCancelled = true
      lenis.destroy()
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || !isGsapReady) return

    // Hero Entrance Animation - Character by character reveal
    if (headlineRef.current) {
      const text = headlineRef.current.textContent || ''
      headlineRef.current.innerHTML = text
        .split('')
        .map((char) => `<span class="inline-block opacity-0" style="will-change: transform">${char === ' ' ? '&nbsp;' : char}</span>`)
        .join('')

      const chars = headlineRef.current.querySelectorAll('span')

      gsap.set(chars, { y: 50 })
      gsap.to(chars, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.02,
        ease: 'expo.out',
        delay: 0.5
      })
    }

    // Voice Sphere magnetic follow
    const handleMouseMove = (e: MouseEvent) => {
      if (sphereRef.current) {
        const rect = sphereRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        const deltaX = (e.clientX - centerX) * 0.1
        const deltaY = (e.clientY - centerY) * 0.1

        gsap.to(sphereRef.current, {
          x: deltaX,
          y: deltaY,
          duration: 1.5,
          ease: 'power2.out'
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Background particles
    const createParticles = () => {
      if (!heroRef.current) return

      for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div')
        particle.className = 'absolute w-1 h-1 bg-[var(--electric-cyan)] rounded-full opacity-20'
        particle.style.left = `${Math.random() * 100}%`
        particle.style.top = `${Math.random() * 100}%`
        heroRef.current.appendChild(particle)

        gsap.to(particle, {
          y: -100,
          opacity: 0,
          duration: 3 + Math.random() * 2,
          repeat: -1,
          delay: Math.random() * 3,
          ease: 'none'
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

    const cleanupFns: Array<() => void> = []

    // Small delay to ensure DOM is ready
    const t = setTimeout(() => {
      // Scanner Transition Animation
      if (scannerRef.current) {
        const revealItems = scannerRef.current.querySelectorAll('.scan-card')

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: scannerRef.current,
            start: 'top 80%',
            end: 'bottom 60%',
            scrub: 1,
            markers: false,
          }
        })

        revealItems.forEach((item, i) => {
          tl.fromTo(item,
            {
              opacity: 0,
              filter: 'blur(10px)',
              scale: 0.92,
              y: 50
            },
            {
              opacity: 1,
              filter: 'blur(0px)',
              scale: 1,
              y: 0,
              duration: 0.6
            },
            i * 0.2
          )
        })
      }

      // Landing preview animation
      if (phoneRef.current) {
        const copy = phoneRef.current.querySelectorAll('.landing-copy > *')
        const mock = phoneRef.current.querySelector('.landing-mock')
        const chatViewport = phoneRef.current.querySelector('.ml-chat-viewport')
        const chatList = phoneRef.current.querySelector('.ml-chat-list')
        const chatBubbles = phoneRef.current.querySelectorAll('.ml-chat-bubble')
        const wavePaths = phoneRef.current.querySelectorAll('.ml-wave-path')
        const waveDash = phoneRef.current.querySelector('.ml-wave-dash')

        gsap.from(copy, {
          opacity: 0,
          y: 30,
          stagger: 0.08,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: phoneRef.current,
            start: 'top 70%',
          }
        })

        if (mock) {
          gsap.fromTo(mock,
            { opacity: 0, y: 40, scale: 0.95 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 1,
              ease: 'power4.out',
              scrollTrigger: {
                trigger: phoneRef.current,
                start: 'top 70%',
              }
            }
          )
        }

        if (wavePaths.length) {
          const waveD1 = 'M0,20 C14,8 28,32 42,20 C56,8 70,32 84,20 C98,8 112,32 126,20 C140,8 154,32 168,20 C182,8 196,32 210,20'
          const waveD2 = 'M0,20 C14,12 28,28 42,20 C56,4 70,36 84,20 C98,10 112,30 126,20 C140,6 154,34 168,20 C182,14 196,26 210,20'
          const waveD3 = 'M0,20 C14,6 28,34 42,20 C56,14 70,26 84,20 C98,2 112,38 126,20 C140,10 154,30 168,20 C182,4 196,36 210,20'

          const waveTween = gsap.to(wavePaths, {
            keyframes: [
              { attr: { d: waveD2 }, duration: 0.5 },
              { attr: { d: waveD3 }, duration: 0.5 },
              { attr: { d: waveD1 }, duration: 0.5 },
            ],
            repeat: -1,
            ease: 'sine.inOut',
          })
          cleanupFns.push(() => waveTween.kill())
        }

        if (waveDash) {
          const dashTween = gsap.to(waveDash, { attr: { strokeDashoffset: -220 }, duration: 1.6, repeat: -1, ease: 'none' })
          cleanupFns.push(() => dashTween.kill())
        }

        if (mock && chatViewport && chatList && chatBubbles.length) {
          gsap.set(chatBubbles, { opacity: 0, y: 16 })

          const phoneTl = gsap.timeline({
            scrollTrigger: {
              trigger: phoneRef.current,
              start: 'top top',
              end: '+=1800',
              scrub: true,
              pin: mock,
              pinSpacing: true,
              markers: false,
            },
          })

          const shift = Math.max(0, (chatList as HTMLElement).scrollHeight - (chatViewport as HTMLElement).clientHeight)
          phoneTl.to(chatList, { y: -shift, ease: 'none', duration: 1 }, 0)

          chatBubbles.forEach((bubble, i) => {
            phoneTl.to(bubble, { opacity: 1, y: 0, ease: 'none', duration: 0.15 }, i * 0.14)
          })

          cleanupFns.push(() => {
            phoneTl.scrollTrigger?.kill()
            phoneTl.kill()
          })
        }
      }

      // QR Explosion Effect
      if (qrRef.current) {
        const qrImage = qrRef.current.querySelector('.qr-image')
        const cta = qrRef.current.querySelector('.cta-button')

        if (qrImage) {
          gsap.fromTo(qrImage,
            { scale: 0.7, opacity: 0, rotation: -10 },
            {
              scale: 1,
              opacity: 1,
              rotation: 0,
              duration: 1.1,
              ease: 'back.out(1.7)',
              scrollTrigger: {
                trigger: qrRef.current,
                start: 'top 65%'
              }
            }
          )
        }

        if (cta) {
          gsap.fromTo(cta,
            { scale: 0.8, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 1,
              delay: 0.4,
              ease: 'elastic.out(1, 0.5)',
              scrollTrigger: {
                trigger: qrRef.current,
                start: 'top 60%'
              }
            }
          )
        }
      }

      // Refresh ScrollTrigger after setup
      ;(gsap as any).ScrollTrigger?.refresh?.()
    }, 500)

    return () => {
      clearTimeout(t)
      cleanupFns.forEach((fn) => fn())
    }
  }, [isLoaded, isGsapReady])

  const tiers = [
    {
      name: 'Essential Voice',
      icon: 'I',
      price: '$99/mo',
      features: ['Single language', '1,000 conversations/mo', 'Smart prompts', 'QR codes + landing'],
      color: 'from-blue-400 to-blue-600'
    },
    {
      name: 'Multi-Language Pro',
      icon: 'II',
      price: '$299/mo',
      features: ['50+ languages', '5,000 conversations/mo', 'Advanced analytics', 'Custom branding'],
      color: 'from-[var(--electric-cyan)] to-[var(--royal-violet)]',
      popular: true
    },
    {
      name: 'Enterprise',
      icon: 'III',
      price: 'Custom',
      features: ['Unlimited everything', 'Dedicated support', 'White label', 'API + SSO'],
      color: 'from-purple-500 to-pink-600'
    }
  ]

  const scanSteps = [
    {
      title: 'Scan',
      desc: 'Visitors tap a glowing QR and launch the agent in seconds.',
      image: '/assets/exhibits/museum-scan.jpg'
    },
    {
      title: 'Pay',
      desc: 'Optional Stripe paywall unlocks premium stories and tours.',
      image: '/assets/exhibits/paywall.jpg'
    },
    {
      title: 'Talk',
      desc: 'Real-time voice chat tailored to the exhibit and venue brand.',
      image: '/assets/exhibits/live-call.jpg'
    }
  ]

  const monaLisaChat = [
    { side: 'ai' as const, text: 'Welcome. Stand a little closer — the softer the edge, the louder the feeling.' },
    { side: 'user' as const, text: 'Why is your smile so mysterious?' },
    { side: 'ai' as const, text: 'Because Leonardo painted me with sfumato — soft edges that let emotions shift as you look.' },
    { side: 'user' as const, text: 'Were you meant to be happy?' },
    { side: 'ai' as const, text: 'I am meant to be human. A smile that holds both warmth and distance.' },
    { side: 'user' as const, text: 'What makes this painting feel alive?' },
    { side: 'ai' as const, text: 'The gaze. The light. The unfinished certainty — your mind completes the story.' },
    { side: 'user' as const, text: 'Is it true you have no eyebrows?' },
    { side: 'ai' as const, text: 'Some say they faded, others say Leonardo left them out. Mystery is part of my job.' },
    { side: 'user' as const, text: 'What should I notice next?' },
    { side: 'ai' as const, text: 'Look at the landscape behind me — it is a world that doesn’t quite belong to ours.' },
    { side: 'user' as const, text: 'What would you ask me?' },
    { side: 'ai' as const, text: 'What do you feel first: calm, curiosity, or unease? That answer is also my portrait.' },
  ]

  return (
    <div className="min-h-screen bg-[#05060B] text-white overflow-x-hidden">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass backdrop-blur-lg bg-white/70 border-b border-white/30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold gradient-text tracking-tight">Voicify It</div>
          <div className="flex gap-3 items-center">
            <Link href="/auth/signin" className="text-sm text-[var(--text-secondary)] hover:text-[var(--electric-cyan)] transition-colors font-semibold">
              Sign In
            </Link>
            <Link href="/auth/signup">
              <button className="btn-primary px-5 py-2 text-sm shadow-[0_0_25px_rgba(0,245,255,0.35)]">
                Launch an Agent
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Section 1: Hero Command Deck */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24"
        style={{
          willChange: 'transform',
          background: 'radial-gradient(circle at 20% 20%, rgba(0,245,255,0.08), transparent 30%), radial-gradient(circle at 80% 0%, rgba(138,43,226,0.12), transparent 35%), linear-gradient(135deg, #0a0c14 0%, #0b0f1f 50%, #0a0c14 100%)',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 15s ease infinite'
        }}
      >
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'url(/assets/backgrounds/neural-grid.png)', backgroundSize: 'cover', mixBlendMode: 'screen' }} />

        {/* Main content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 glass-card mb-6 px-4 py-2 bg-white/10 border border-white/20">
              <span className="w-2 h-2 bg-[var(--electric-cyan)] rounded-full animate-pulse" />
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)] font-semibold">Command your exhibits</span>
            </div>

            <h1
              ref={headlineRef}
              className="text-5xl md:text-7xl font-black mb-6 leading-tight text-white drop-shadow-[0_10px_30px_rgba(0,245,255,0.15)]"
              style={{ willChange: 'transform' }}
            >
              AI Voice Agents
              <br />
              for Museums & Events
            </h1>

            <p className="text-lg md:text-xl text-white/80 font-medium mb-8 max-w-2xl">
              Scan, pay, and start a live conversation with every exhibit. Voicify It handles the voice, the paywall, and the branded landing page.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/signup">
                <button className="btn-primary inline-flex items-center gap-3 px-8 py-4 text-base shadow-[0_0_40px_rgba(0,245,255,0.45)]">
                  <span>Build an Agent</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </Link>
              <Link href="/visitor">
                <button className="btn-glass inline-flex items-center gap-3 px-8 py-4 text-base border border-white/30 bg-white/10 text-white">
                  <span>See the Demo</span>
                </button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div
              ref={sphereRef}
              className="hero-card relative glass-card bg-white/10 border border-white/20 rounded-3xl p-6 overflow-hidden"
              style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.4)', willChange: 'transform' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[rgba(0,245,255,0.08)] via-[rgba(138,43,226,0.05)] to-transparent pointer-events-none" />
              <div className="relative aspect-square w-full max-w-[420px] mx-auto">
                <Image
                  src="/assets/hero/voice-sphere-3d.png"
                  alt="Voicify It voice sphere"
                  fill
                  sizes="(max-width: 768px) 90vw, 420px"
                  className="object-contain drop-shadow-[0_0_45px_rgba(0,245,255,0.35)]"
                  priority
                />
              </div>
              <div className="mt-6 text-center text-sm text-white/70">
                Parallax and GSAP-driven entrance animation keep the hero kinetic.
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce z-10">
          <div className="w-6 h-10 rounded-full border-2 border-[var(--electric-cyan)] border-opacity-70 flex items-start justify-center p-2 bg-white/50">
            <div className="w-1 h-3 bg-[var(--electric-cyan)] rounded-full" />
          </div>
        </div>
      </section>

      {/* Section 2: Scan • Pay • Talk */}
      <section
        ref={scannerRef}
        className="relative min-h-screen flex items-center justify-center py-28 px-4 bg-gradient-to-b from-[#0b0f1f] via-[#0f152a] to-[#0b0f1f]"
        style={{
          backgroundImage: 'linear-gradient(180deg, rgba(0,245,255,0.08), rgba(138,43,226,0.05))'
        }}
      >
        <div className="absolute inset-0 bg-[url('/assets/backgrounds/neural-grid.png')] opacity-30 mix-blend-screen" />

        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-white">
            Scan • Pay • Talk
          </h2>
          <p className="text-center text-white/70 max-w-2xl mx-auto mb-16">
            Every visitor journey is a kinetic story: a glowing QR, a branded paywall, and a live AI voice that knows the exhibit by heart.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {scanSteps.map((step, idx) => (
              <div
                key={step.title}
                className="scan-card glass-card bg-white/5 border border-white/10 rounded-2xl overflow-hidden group relative"
                style={{ willChange: 'transform, opacity, filter' }}
              >
                <div className="relative h-56 w-full overflow-hidden">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 360px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <div className="absolute bottom-3 left-3 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white/80 bg-black/40 rounded-full border border-white/10">
                    {`0${idx + 1}`}
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--electric-cyan)] shadow-[0_0_10px_rgba(0,245,255,0.7)]" />
                    {step.title}
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed">{step.desc}</p>
                </div>
                <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-[var(--electric-cyan)]/60 transition-colors duration-300 shadow-[0_0_20px_rgba(0,245,255,0.25)]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Agent Tier Bento Grid - Purple/pink gradient */}
      <section
        className="relative py-32 px-4"
        style={{
          background: 'radial-gradient(circle at 15% 20%, rgba(0,245,255,0.10), transparent 35%), radial-gradient(circle at 80% 10%, rgba(138,43,226,0.12), transparent 40%), linear-gradient(135deg, #0a0c14 0%, #0b0f1f 55%, #0a0c14 100%)'
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-[url('/assets/backgrounds/neural-grid.png')] opacity-20 mix-blend-screen" />

        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6">
            Choose Your <span className="gradient-text drop-shadow-lg">Agent Tier</span>
          </h2>
          <p className="text-center text-white/70 max-w-2xl mx-auto mb-16">
            Start simple, go multilingual, or unlock advanced workflows across email, SMS, and social.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier, i) => (
              <div
                key={i}
                onMouseEnter={() => setActiveTier(i)}
                onMouseLeave={() => setActiveTier(null)}
                className={`relative glass-card cursor-pointer transition-all duration-500 bg-white/5 border border-white/10 ${
                  activeTier === null || activeTier === i
                    ? 'opacity-100 scale-100'
                    : 'opacity-30 scale-95'
                } ${activeTier === i ? 'scale-105 shadow-2xl' : ''}`}
                style={{ willChange: 'transform, opacity' }}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[var(--electric-cyan)] to-[var(--royal-violet)] text-white text-sm font-bold rounded-full shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="text-6xl mb-4 flex justify-center">
                  <div className={`relative ${tier.name === 'Multi-Language Pro' ? 'orbit-container' : ''}`}>
                    {tier.icon}
                    {tier.name === 'Multi-Language Pro' && (
                      <div className="absolute inset-0">
                        {['EN', 'ES', 'FR', 'JP'].map((flag, idx) => (
                          <span
                            key={idx}
                            className="absolute text-2xl"
                            style={{
                              animation: `orbit 10s linear infinite`,
                              animationDelay: `${idx * 2.5}s`,
                              transformOrigin: '50px 50px'
                            }}
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-2 text-center text-white">{tier.name}</h3>
                <div className={`text-4xl font-bold mb-6 text-center bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>
                  {tier.price}
                </div>

                <ul className="space-y-3">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-white/75">
                      <svg className="w-5 h-5 text-[var(--electric-cyan)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button className="w-full mt-6 py-3 rounded-xl font-semibold border border-white/20 bg-white/10 text-white hover:border-[var(--electric-cyan)]/50 hover:shadow-[0_0_25px_rgba(0,245,255,0.25)] transition-all">
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Landing Preview & Voice Flow */}
      <section
        ref={phoneRef}
        className="relative min-h-screen flex items-center justify-center py-24 px-4 bg-gradient-to-br from-[#0b1224] via-[#0f1a34] to-[#0b1224]"
      >
        <div className="absolute inset-0 bg-[url('/assets/backgrounds/neural-grid.png')] opacity-25 mix-blend-screen" />

        <div className="relative z-10 w-full max-w-6xl grid md:grid-cols-2 gap-10 items-center">
          <div className="landing-copy space-y-4 text-white">
            <h3 className="text-sm uppercase tracking-[0.3em] text-white/60">Landing Page Preview</h3>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Branded landing pages that feel alive
            </h2>
            <p className="text-white/70 leading-relaxed">
              Swap venue backgrounds, drop in hero art, and let visitors tap “Talk with Agent” instantly. Scroll reveals a living conversation between the visitor and the exhibit.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {["AI-spec hero images", "QR-first flows", "Stripe paywall ready", "Mobile-optimized"].map((item) => (
                <div key={item} className="glass-card bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-[var(--electric-cyan)] rounded-full shadow-[0_0_12px_rgba(0,245,255,0.7)]" />
                  <span className="text-sm text-white/80">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="landing-mock glass-card w-full max-w-md mx-auto rounded-3xl p-4 relative overflow-hidden bg-white/10 border border-white/15"
                 style={{ boxShadow: '0 25px 80px rgba(0,0,0,0.35)' }}>
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-black/20" />
              <div className="relative aspect-[3/5] rounded-2xl overflow-hidden bg-[#05060B] border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                <div className="relative z-10 px-5 pt-6 pb-4 border-b border-white/10 bg-black/10 backdrop-blur">
                  <div className="text-center">
                    <div className="text-[11px] tracking-[0.25em] uppercase text-white/50 mb-2">Visitor Experience</div>
                    <div className="text-xl font-black text-white leading-tight">Mona Lisa</div>

                    <div className="mt-3 flex items-center justify-center">
                      <svg width="220" height="40" viewBox="0 0 220 40" className="opacity-95">
                        <defs>
                          <linearGradient id="mlWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="var(--electric-cyan)" />
                            <stop offset="100%" stopColor="var(--royal-violet)" />
                          </linearGradient>
                        </defs>
                        <path
                          className="ml-wave-path ml-wave-dash"
                          d="M0,20 C14,8 28,32 42,20 C56,8 70,32 84,20 C98,8 112,32 126,20 C140,8 154,32 168,20 C182,8 196,32 210,20"
                          fill="none"
                          stroke="url(#mlWaveGrad)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray="10 12"
                          strokeDashoffset="0"
                          style={{ filter: 'drop-shadow(0 0 10px rgba(0,245,255,0.35))' }}
                        />
                        <path
                          className="ml-wave-path"
                          d="M0,20 C14,8 28,32 42,20 C56,8 70,32 84,20 C98,8 112,32 126,20 C140,8 154,32 168,20 C182,8 196,32 210,20"
                          fill="none"
                          stroke="url(#mlWaveGrad)"
                          strokeWidth="8"
                          strokeLinecap="round"
                          opacity="0.12"
                        />
                        <path
                          className="ml-wave-path"
                          d="M0,20 C14,8 28,32 42,20 C56,8 70,32 84,20 C98,8 112,32 126,20 C140,8 154,32 168,20 C182,8 196,32 210,20"
                          fill="none"
                          stroke="url(#mlWaveGrad)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          opacity="0.45"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="ml-chat-viewport relative z-10 px-5 py-5 h-[calc(100%-150px)] overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#05060B] to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#05060B] to-transparent pointer-events-none" />

                  <div className="ml-chat-list space-y-3 will-change-transform">
                    {monaLisaChat.map((m, i) => (
                      <div
                        key={i}
                        className={['ml-chat-bubble flex items-end gap-2', m.side === 'ai' ? 'justify-start' : 'justify-end'].join(' ')}
                        style={{ willChange: 'transform, opacity' }}
                      >
                        {m.side === 'ai' && (
                          <div className="shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 grid place-items-center text-[10px] font-black text-white/70">
                            ML
                          </div>
                        )}
                        <div
                          className={[
                            'max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm',
                            m.side === 'ai'
                              ? 'bg-white/10 text-white rounded-bl-sm border border-white/10'
                              : 'bg-gradient-to-r from-[var(--electric-cyan)] to-[var(--royal-violet)] text-black rounded-br-sm',
                          ].join(' ')}
                        >
                          {m.text}
                        </div>
                        {m.side === 'user' && (
                          <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[var(--electric-cyan)] to-[var(--royal-violet)] grid place-items-center text-[10px] font-black text-black">
                            You
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-6 pt-4 bg-gradient-to-t from-[#05060B] to-transparent">
                  <div className="w-full py-4 rounded-2xl bg-white text-black font-black text-center text-sm shadow-[0_0_30px_rgba(255,255,255,0.08)]">
                    Talk with Agent
                  </div>
                </div>
              </div>
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-gradient-to-br from-[var(--electric-cyan)]/30 to-[var(--royal-violet)]/20 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: QR CTA */}
      <section
        ref={qrRef}
        className="relative min-h-screen flex items-center justify-center py-32 px-4"
        style={{
          background: 'linear-gradient(135deg, #0f1628 0%, #101c33 40%, #0f1628 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 20s ease infinite'
        }}
      >
        <div className="absolute inset-0 bg-[url('/assets/backgrounds/neural-grid.png')] opacity-20 mix-blend-screen" />

        <div className="relative max-w-4xl mx-auto text-center z-10">
          <div className="qr-image relative w-64 h-64 mx-auto mb-12">
            <Image
              src="/assets/icons/qr-artistic.png"
              alt="Artistic QR code"
              fill
              sizes="256px"
              className="object-contain drop-shadow-[0_0_40px_rgba(0,245,255,0.45)]"
            />
          </div>

          <div className="cta-button opacity-0">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white drop-shadow-lg">
              Ready to <span className="gradient-text">Give Voice</span> to Your Exhibits?
            </h2>
            <p className="text-lg text-white/80 font-medium mb-10 max-w-2xl mx-auto">
              Launch a QR-to-voice journey that feels intentional, branded, and alive for every venue.
            </p>
            <Link href="/auth/signup">
              <button
                className="btn-primary text-lg px-10 py-5 shadow-2xl"
                style={{
                  boxShadow: '0 0 60px rgba(0,245,255,0.6)',
                  animation: 'pulse 2s ease-in-out infinite'
                }}
              >
                Launch Your First Agent
              </button>
            </Link>
            <p className="text-sm text-white/70 mt-6 font-medium">
              No credit card required · 14-day free trial · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4 bg-[#05060B]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-2xl font-bold gradient-text">Voicify It</div>
          <div className="text-white/60 text-sm">
            (c) 2024 Voicify It. All rights reserved.
          </div>
          <div className="flex gap-6">
            <Link href="/auth/signin" className="text-white/70 hover:text-[var(--electric-cyan)] transition-colors">
              Sign In
            </Link>
            <Link href="/exhibits" className="text-white/70 hover:text-[var(--electric-cyan)] transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(60px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(60px) rotate(-360deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 40px rgba(0,245,255,0.6);
          }
          50% {
            box-shadow: 0 0 80px rgba(0,245,255,0.9);
          }
        }

        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  )
}
