'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function Header() {
  const router = useRouter()
  const [orgName, setOrgName] = useState<string>('Loading...')

  useEffect(() => {
    async function fetchOrg() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('owner_user_id', user.id)
        .single()

      if (org) {
        setOrgName(org.name)
      }
    }
    fetchOrg()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/exhibits" className="text-xl font-bold gradient-text">
            ITtalksBack
          </Link>
          <nav className="flex gap-4">
            <Link href="/exhibits" className="text-sm hover:underline">
              Exhibits
            </Link>
            <Link href="/billing" className="text-sm hover:underline">
              Billing
            </Link>
            <Link href="/settings" className="text-sm hover:underline">
              Settings
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {/* Organization switcher placeholder */}
          <div className="text-sm text-muted-foreground">
            Organization: <span className="font-medium">{orgName}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}
