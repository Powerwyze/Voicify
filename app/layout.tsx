import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Voicify It - AI Voice Agent Platform',
  description: 'Transform your museum or event with AI voice agents. Engage visitors through natural conversations.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body
        className={inter.className}
        suppressHydrationWarning
        style={{ backgroundColor: '#ffffff', color: '#111827' }}
      >
        {children}
      </body>
    </html>
  )
}
