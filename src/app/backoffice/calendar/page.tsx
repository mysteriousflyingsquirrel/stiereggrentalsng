'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useApartments } from '@/hooks/useApartments'
import type { Apartment } from '@/data/apartments'
import type { BookedRange } from '@/lib/availability'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

/** Format YYYY-MM-DD */
function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** ISO day-of-week (Mo=0 … Su=6) */
function isoDow(d: Date): number {
  const dow = d.getDay()
  return dow === 0 ? 6 : dow - 1
}

/** Build a Set of YYYY-MM-DD strings from booked ranges */
function buildBookedSet(ranges: BookedRange[]): Set<string> {
  const set = new Set<string>()
  for (const range of ranges) {
    const start = new Date(range.start)
    const end = new Date(range.end)
    const current = new Date(start)
    while (current <= end) {
      set.add(fmtDate(current))
      current.setDate(current.getDate() + 1)
    }
  }
  return set
}

// Apartment colour palette for the Gantt view
const APT_COLORS = [
  '#3B82F6', '#EF4444', '#22C55E', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#0EA5E9',
]

// ---------------------------------------------------------------------------
// Data fetching hook
// ---------------------------------------------------------------------------

function useAvailability(slugs: string[]) {
  const [data, setData] = useState<Record<string, BookedRange[]>>({})
  const [loading, setLoading] = useState(false)

  // Stringify slugs so the effect only re-runs when the list actually changes
  const slugKey = slugs.join(',')

  useEffect(() => {
    if (slugs.length === 0) {
      setData({})
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all(
      slugs.map(async (slug) => {
        try {
          const res = await fetch(`/api/availability?slug=${slug}`)
          if (!res.ok) return { slug, ranges: [] as BookedRange[] }
          const json = await res.json()
          return { slug, ranges: (json.bookedRanges ?? []) as BookedRange[] }
        } catch {
          return { slug, ranges: [] as BookedRange[] }
        }
      })
    ).then((results) => {
      if (cancelled) return
      const map: Record<string, BookedRange[]> = {}
      for (const r of results) map[r.slug] = r.ranges
      setData(map)
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugKey])

  return { data, loading }
}

// ---------------------------------------------------------------------------
// Month grid component (single apartment detail view)
// ---------------------------------------------------------------------------

function MonthGrid({
  year,
  month,
  bookedSet,
  today,
}: {
  year: number
  month: number
  bookedSet: Set<string>
  today: string
}) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = isoDow(new Date(year, month, 1))

  const cells: React.ReactNode[] = []

  // Leading blanks
  for (let i = 0; i < firstDow; i++) {
    cells.push(<div key={`b${i}`} className="w-9 h-9" />)
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const isBooked = bookedSet.has(dateStr)
    const isToday = dateStr === today
    const isPast = dateStr < today

    let bg = 'bg-green-50 text-gray-700'
    if (isBooked) bg = 'bg-red-100 text-red-800'
    if (isPast && !isBooked) bg = 'bg-gray-50 text-gray-400'
    if (isPast && isBooked) bg = 'bg-red-50 text-red-400'

    cells.push(
      <div
        key={d}
        className={`w-9 h-9 rounded-md text-xs font-medium flex items-center justify-center
          ${bg}
          ${isToday ? 'ring-2 ring-accent ring-offset-1' : ''}
        `}
        title={`${MONTH_NAMES[month]} ${d}, ${year}${isBooked ? ' — Booked' : ''}`}
      >
        {d}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">
        {MONTH_NAMES[month]} {year}
      </h3>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map((l) => (
          <div key={l} className="w-9 h-6 text-[10px] font-medium text-gray-400 flex items-center justify-center">
            {l}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Gantt strip for "All Apartments" view
// ---------------------------------------------------------------------------

function GanttView({
  apartments,
  availabilityData,
  startDate,
  totalDays,
  today,
}: {
  apartments: Apartment[]
  availabilityData: Record<string, BookedRange[]>
  startDate: Date
  totalDays: number
  today: string
}) {
  // Build date labels
  const dates = useMemo(() => {
    const arr: string[] = []
    const d = new Date(startDate)
    for (let i = 0; i < totalDays; i++) {
      arr.push(fmtDate(d))
      d.setDate(d.getDate() + 1)
    }
    return arr
  }, [startDate, totalDays])

  // Month headers
  const monthHeaders = useMemo(() => {
    const headers: { label: string; span: number }[] = []
    let currentLabel = ''
    let currentSpan = 0

    for (const dateStr of dates) {
      const d = new Date(dateStr)
      const label = `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
      if (label === currentLabel) {
        currentSpan++
      } else {
        if (currentLabel) headers.push({ label: currentLabel, span: currentSpan })
        currentLabel = label
        currentSpan = 1
      }
    }
    if (currentLabel) headers.push({ label: currentLabel, span: currentSpan })
    return headers
  }, [dates])

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${Math.max(totalDays * 22 + 180, 600)}px` }}>
          {/* Month headers row */}
          <div className="flex border-b border-gray-200">
            <div className="w-44 flex-shrink-0 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
              Apartment
            </div>
            <div className="flex-1 flex">
              {monthHeaders.map((mh, i) => (
                <div
                  key={i}
                  className="text-[10px] font-semibold text-gray-500 text-center py-2 border-l border-gray-100 first:border-l-0"
                  style={{ width: `${mh.span * 22}px`, minWidth: `${mh.span * 22}px` }}
                >
                  {mh.label}
                </div>
              ))}
            </div>
          </div>

          {/* Day numbers header */}
          <div className="flex border-b border-gray-200">
            <div className="w-44 flex-shrink-0 bg-gray-50" />
            <div className="flex-1 flex">
              {dates.map((dateStr) => {
                const d = new Date(dateStr)
                const day = d.getDate()
                const isWeekend = d.getDay() === 0 || d.getDay() === 6
                const isFirst = day === 1
                return (
                  <div
                    key={dateStr}
                    className={`w-[22px] min-w-[22px] text-[9px] text-center py-1
                      ${isWeekend ? 'text-gray-400' : 'text-gray-500'}
                      ${isFirst ? 'border-l border-gray-200' : ''}
                      ${dateStr === today ? 'font-bold text-accent' : ''}
                    `}
                  >
                    {day}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Apartment rows */}
          {apartments.map((apt, aptIdx) => {
            const bookedSet = buildBookedSet(availabilityData[apt.slug] ?? [])
            const color = APT_COLORS[aptIdx % APT_COLORS.length]

            return (
              <div key={apt.slug} className="flex border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50">
                <div className="w-44 flex-shrink-0 px-4 py-2 flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-medium text-gray-800 truncate" title={apt.name.en}>
                    {apt.name.en}
                  </span>
                </div>
                <div className="flex-1 flex items-center">
                  {dates.map((dateStr) => {
                    const isBooked = bookedSet.has(dateStr)
                    const isPast = dateStr < today
                    const d = new Date(dateStr)
                    const isFirst = d.getDate() === 1
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6

                    let bg = ''
                    if (isBooked) {
                      bg = isPast ? 'bg-red-200' : 'bg-red-400'
                    } else if (isPast) {
                      bg = 'bg-gray-100'
                    } else if (isWeekend) {
                      bg = 'bg-gray-50'
                    }

                    return (
                      <div
                        key={dateStr}
                        className={`w-[22px] min-w-[22px] h-8 ${bg}
                          ${isFirst ? 'border-l border-gray-200' : ''}
                          ${dateStr === today ? 'ring-1 ring-inset ring-accent' : ''}
                        `}
                        title={`${apt.name.en} — ${dateStr}${isBooked ? ' (Booked)' : ''}`}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function BackofficeCalendarPage() {
  const { apartments, loading: aptsLoading } = useApartments()
  const [selectedSlug, setSelectedSlug] = useState<string | '__all__'>('__all__')
  const [monthOffset, setMonthOffset] = useState(0) // 0 = current month

  // Determine which slugs to fetch availability for
  const slugsToFetch = useMemo(() => {
    if (aptsLoading || apartments.length === 0) return []
    if (selectedSlug === '__all__') return apartments.map((a) => a.slug)
    return [selectedSlug]
  }, [apartments, selectedSlug, aptsLoading])

  const { data: availabilityData, loading: availLoading } = useAvailability(slugsToFetch)

  const today = fmtDate(new Date())

  // For single-apartment detail view: compute 3 months to show
  const monthsToShow = useMemo(() => {
    const now = new Date()
    const months: { year: number; month: number }[] = []
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + monthOffset + i, 1)
      months.push({ year: d.getFullYear(), month: d.getMonth() })
    }
    return months
  }, [monthOffset])

  // For Gantt view: 90 days starting from 1st of current month + offset
  const ganttConfig = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
    return { startDate: start, totalDays: 90 }
  }, [monthOffset])

  // Navigate
  const goBack = useCallback(() => setMonthOffset((prev) => prev - 1), [])
  const goForward = useCallback(() => setMonthOffset((prev) => prev + 1), [])
  const goToday = useCallback(() => setMonthOffset(0), [])

  // Selected apartment data for detail view
  const selectedApartment = apartments.find((a) => a.slug === selectedSlug)

  if (aptsLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Calendar</h1>
        <p className="text-gray-500">Loading apartments…</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>

        {/* Apartment selector */}
        <select
          value={selectedSlug}
          onChange={(e) => {
            setSelectedSlug(e.target.value)
            setMonthOffset(0)
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        >
          <option value="__all__">All Apartments</option>
          {apartments.map((apt) => (
            <option key={apt.slug} value={apt.slug}>
              {apt.name.en}
            </option>
          ))}
        </select>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={goBack}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Prev
        </button>
        <button
          onClick={goToday}
          className="px-3 py-1.5 text-sm font-medium text-accent bg-white border border-accent rounded-lg hover:bg-accent/5 transition-colors"
        >
          Today
        </button>
        <button
          onClick={goForward}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Next →
        </button>
        {monthOffset !== 0 && (
          <span className="text-xs text-gray-400 ml-2">
            {monthOffset > 0 ? `+${monthOffset}` : monthOffset} months from now
          </span>
        )}
      </div>

      {/* Loading indicator */}
      {availLoading && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-accent rounded-full animate-spin" />
          Fetching availability…
        </div>
      )}

      {/* Content */}
      {selectedSlug === '__all__' ? (
        /* ---- All Apartments Gantt View ---- */
        <>
          <GanttView
            apartments={apartments}
            availabilityData={availabilityData}
            startDate={ganttConfig.startDate}
            totalDays={ganttConfig.totalDays}
            today={today}
          />

          {/* Legend */}
          <div className="mt-4 bg-white rounded-xl shadow-sm p-4">
            <div className="flex flex-wrap gap-4 items-center text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 rounded bg-red-400" />
                Booked
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 rounded bg-red-200" />
                Booked (past)
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 rounded bg-white border border-gray-200" />
                Available
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 rounded bg-gray-100" />
                Past
              </div>
            </div>
          </div>
        </>
      ) : selectedApartment ? (
        /* ---- Single Apartment Detail View ---- */
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {monthsToShow.map(({ year, month }) => (
              <MonthGrid
                key={`${year}-${month}`}
                year={year}
                month={month}
                bookedSet={buildBookedSet(availabilityData[selectedSlug] ?? [])}
                today={today}
              />
            ))}
          </div>

          {/* Stats */}
          {!availLoading && availabilityData[selectedSlug] && (
            <div className="mt-4 bg-white rounded-xl shadow-sm p-4">
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-gray-500">Active bookings:</span>{' '}
                  <span className="font-semibold text-gray-900">
                    {availabilityData[selectedSlug].filter(
                      (r) => r.end >= today
                    ).length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Next 30 days booked:</span>{' '}
                  <span className="font-semibold text-gray-900">
                    {(() => {
                      const set = buildBookedSet(availabilityData[selectedSlug])
                      let count = 0
                      const d = new Date()
                      for (let i = 0; i < 30; i++) {
                        if (set.has(fmtDate(d))) count++
                        d.setDate(d.getDate() + 1)
                      }
                      return `${count} / 30 days`
                    })()}
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 items-center text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-md bg-red-100" />
                  Booked
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-md bg-green-50 border border-green-200" />
                  Available
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-md ring-2 ring-accent ring-offset-1" />
                  Today
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-500">Apartment not found.</p>
      )}
    </div>
  )
}
