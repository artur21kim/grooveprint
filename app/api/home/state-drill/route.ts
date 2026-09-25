import { createClient } from '@supabase/supabase-js'
import { NextResponse }  from 'next/server'

export const dynamic = 'force-dynamic'

// dim_venue.country stores full names; map ISO codes from the client to full names
function isoToFullCountry(iso: string): string | null {
  const map: Record<string, string> = {
    AU: 'Australia',
    US: 'United States',
    CA: 'Canada',
  }
  return map[iso.toUpperCase()] ?? null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const state   = searchParams.get('state')
  const country = searchParams.get('country')  // ISO code e.g. 'AU', or null for NA states

  if (!state) {
    return NextResponse.json({ error: 'state required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [artistsRes, venuesRes] = await Promise.all([
    supabase.rpc('get_home_top_artists', { p_state: state }),
    supabase.rpc('get_home_top_venues',  { p_state: state }),
  ])

  if (artistsRes.error) console.error('[state-drill] artists error:', artistsRes.error)
  if (venuesRes.error)  console.error('[state-drill] venues error:',  venuesRes.error)

  // Post-filter venues by country when a country param is supplied.
  // The RPC filters by state only (no country param), so for colliding codes
  // like WA (Washington US + Western Australia AU) we strip the wrong hemisphere.
  let venues = venuesRes.data ?? []
  if (country) {
    const fullCountry = isoToFullCountry(country)
    if (fullCountry) {
      venues = venues.filter((v: any) =>
        (v.country ?? '').toLowerCase() === fullCountry.toLowerCase()
      )
    }
  }

  return NextResponse.json({
    artists: artistsRes.data ?? [],
    venues,
  })
}
