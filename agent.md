# Nano Banana + UI Agent Brief — Voicify It

This file is the ready-to-run prompt for your coding agent to build the Voicify It marketing/home experience and the playbook for Nano Banana to generate the missing visuals. Replace any lingering Powerwyze mentions with Voicify It. Do not surface the platform/stack on the main landing page. Each page should feel unique but stay inside the Voicify It visual universe.

---

## Brand and Visual System
- Name: Voicify It — AI voice agents for museums and events (QR → optional paywall → live voice).
- Palette (high-impact AI/tech marketing): Electric Cyan `#00F5FF`, Neon Magenta `#FF3D9A`, Royal Violet `#8A2BE2`, Deep Space Navy `#04060B`, Soft Light `#F7FBFF`.
- Style: glassmorphism cards, holographic glows, crisp gradients, cinematic rim lighting, minimal grids, subtle noise textures, neon edge highlights.
- Motion: GSAP for kinetic entrances (staggered y/opacity), parallax hero, hover glows, waveform loops. Prefer `power4.out` and `back.out(1.4)` with `stagger: 0.08`.

---

## UI Build Prompt (give this verbatim to the coding agent)
1) Hero (no-scroll fold): left column copy “AI Voice Agents for Museums & Events” with subcopy about QR → paywall → live voice. CTAs: “Build an Agent” (primary) and “See the Demo” (ghost). Right column: floating 3D voice sphere over a glass card, GSAP parallax on pointer move, entrance `from` y:60, opacity:0, duration:1.
2) Background treatment: animated particle grid/neural overlay with low opacity, slow pan. Keep platform/stack references out of view.
3) “Scan • Pay • Talk” strip: three animated cards (GSAP stagger) showing QR scan, Stripe paywall, live voice call. Use the Nano Banana photographic assets; add Electric Cyan hover border glows.
4) “Agent Tiers” carousel: Tier 1 basic, Tier 2 multilingual, Tier 3 advanced (email/SMS/social). Add a looping GSAP mini-waveform per card (randomized heights).
5) “Landing Page Preview”: centered mobile mock with swappable venue background slider; shows agent name, hero image, “Talk with Agent” button; glassmorphism shell.
6) “Command Center Dashboard”: drop in the Agent Manager React snippet (Tailwind + GSAP). Cards glow cyan on hover and include the Agent Pulse waveform at the bottom edge.
7) “Use Cases” grid: Art Museums, History, Science Centers, Events, Botanical Gardens, Zoos. Each tile uses a distinct photographic asset; hover lift with neon shadow.
8) “Monetization” band: gradient price card for visitor paywalls; floating coin/glow accent.
9) “Technology” strip: ElevenLabs, Vapi, Gemini (text-only callouts). No platform stack mention on the landing hero.
10) Footer CTA: animated artistic QR, headline “Launch your first agent today.”

Page uniqueness: give Dashboard, Pricing, Docs each a distinct background gradient/texture while keeping the shared palette and glass edges.

GSAP starter:
```ts
useEffect(() => {
  gsap.from('.hero-card', { y: 60, opacity: 0, duration: 1, ease: 'power4.out' });
  gsap.from('.scan-card', { y: 40, opacity: 0, stagger: 0.08, duration: 0.9, ease: 'power4.out' });
  gsap.from('.tier-card', { y: 30, opacity: 0, stagger: 0.08, duration: 0.8, ease: 'back.out(1.4)' });
});
```

---

## Nano Banana Asset Tasks (home-first; animated or photoreal as noted)
Save assets under `public/assets/`. Animated variants are preferred when supported; always include a static fallback.

1) Hero Orb Animation (no image needed)
Prompt: Procedural/animated hero orb (CSS/GSAP) with Electric Cyan + Royal Violet glow, subtle scanlines + sheen pass, and a circular spectrum ring that breathes.

2) QR Scan in Museum — `public/assets/exhibits/museum-scan.png` (1200x800)
Prompt: Photoreal art museum; visitor scanning a QR beside a Renaissance painting; QR glows Electric Cyan; warm cinematic lighting, shallow depth.

3) Stripe Paywall — `public/assets/exhibits/paywall.png` (1200x800)
Prompt: Close-up of a phone showing a sleek paywall screen with gradient CTA; blurred museum wall behind; cyan glow on the pay button; photoreal, premium lighting.

4) Live Voice Conversation - `public/assets/exhibits/live-call-mona.png` (1200x800)
Prompt: Person holding a phone near an exhibit; UI shows “Talk with Agent” and a pulsing cyan/violet waveform; dramatic but clean lighting; tech-forward photo.

5) Expo Booth — `public/assets/exhibits/expo-booth.jpg` (1200x800)
Prompt: Futuristic Voicify It booth with LED walls, QR stands, cyan/violet gradients, glass surfaces; event crowd motion-blurred; professional event photography.

6) Zoo Interactive — `public/assets/exhibits/zoo-interactive.jpg` (1200x800)
Prompt: Family at a zoo scanning a QR on a glass panel near a lion habitat; cyan LED accent; bright, inviting, photoreal.

7) Neural Grid Background — `public/assets/backgrounds/neural-grid.png` (1920x1080, tileable)
Prompt: Dark navy base with faint cyan/violet node links; subtle noise; low opacity; seamless if repeated.

8) Animated Voice Wave — `public/assets/ui/voice-wave-animated.svg` (800x400)
Prompt: Smooth multi-band waveform, cyan→magenta gradient, soft glow. Provide static PNG fallback.

9) Mobile Landing Mock — `public/assets/ui/mobile-landing.png` (750x1624)
Prompt: Phone mock showing a Voicify It landing: hero image, agent name, “Talk with Agent” button, QR badge; glass UI shell; cyan/violet gradients; clean minimal layout.

10) Artistic QR — `public/assets/icons/qr-artistic.png` (800x800, transparent)
Prompt: Stylized QR with cyan/violet glow dissolving into particles on one edge; holographic depth; dark-friendly.

11) Floating UI Elements — `public/assets/ui/floating-elements.png` (1920x1080, transparent)
Prompt: Isometric glass UI chips (chat bubbles, mic, waveforms), cyan/violet glows; separated pieces for reuse.

Priority for homepage impact: 1 → 4 → 10 → 2 → 8 → 7 → 3 → 5 → 6 → 9 → 11.

---

## Implementation Notes
- Use Next/Image with descriptive `alt`; ship 2x where relevant and compress smartly.
- Add parallax to the hero asset, hover glows to cards, and looping GSAP waveforms for “activity”.
- Keep landing copy focused on outcomes (scan, pay, talk) and benefits; omit platform/stack mentions.
- Typography: bold condensed for headings, clean grotesk for body.
- Test hero + strip animations on mobile; fall back to static visuals if motion is disabled.

---

## File Map (suggested)
```
public/assets/hero/voice-sphere-3d.png (optional fallback)
public/assets/exhibits/museum-scan.png
public/assets/exhibits/paywall.png
public/assets/exhibits/live-call-mona.png
public/assets/exhibits/expo-booth.jpg
public/assets/exhibits/zoo-interactive.jpg
public/assets/backgrounds/neural-grid.png
public/assets/ui/voice-wave-animated.svg
public/assets/ui/mobile-landing.png
public/assets/ui/floating-elements.png
public/assets/icons/qr-artistic.png
```
