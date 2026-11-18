import { createClient } from '@supabase/supabase-js'
import { NextResponse }  from 'next/server'

export const dynamic = 'force-dynamic'

// dim_venue.country stores full names; map ISO codes from the client
function isoToFullCountry(iso: string): string | null {
  const map: Record<string, string> = {
    AU: 'Australia',
    US: 'United States',
    CA: 'Canada',
    IE: 'Ireland',
    NZ: 'New Zealand',
  }
  return map[iso.toUpperCase()] ?? null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const state   = searchParams.get('state')    // null for country-only drilldowns (IE, NZ)
  const country = searchParams.get('country')  // ISO e.g. 'AU', 'IE', 'NZ', or null for NA states

  if (!state && !country) {
    return NextResponse.json({ error: 'state or country required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fullCountry = country ? isoToFullCountry(country) : null

  // For country-only drilldowns (IE, NZ): p_state is null.
  // get_home_top_artists doesn't yet support p_country — returns empty until SQL migration adds it.
  // get_home_top_venues already supports p_country and correctly filters by country.
  const [artistsRes, venuesRes] = await Promise.all([
    supabase.rpc('get_home_top_artists', { p_state: state ?? null }),
    supabase.rpc('get_home_top_venues',  { p_state: state ?? null, p_country: fullCountry }),
  ])

  if (artistsRes.error) console.error('[state-drill] artists error:', artistsRes.error)
  if (venuesRes.error)  console.error('[state-drill] venues error:',  venuesRes.error)

  return NextResponse.json({
    artists: artistsRes.data ?? [],
    venues:  venuesRes.data  ?? [],
  })
}
