import { NextRequest, NextResponse } from 'next/server'
import { getApartmentBySlug } from '@/data/apartments'
import { getCachedBookedRanges } from '@/lib/availability'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const slug = searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 })
  }

  const apartment = getApartmentBySlug(slug)

  if (!apartment) {
    return NextResponse.json({ error: 'Apartment not found' }, { status: 404 })
  }

  try {
    const bookedRanges = await getCachedBookedRanges(apartment.icalUrls)

    return NextResponse.json({
      slug,
      bookedRanges,
    })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}

