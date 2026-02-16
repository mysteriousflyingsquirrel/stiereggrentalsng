'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { MonthDay } from '@/data/seasons'
import {
  fetchSeasons,
  setSeason,
  deleteSeason,
  type SeasonDocument,
} from '@/lib/seasonService'

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

/** Preset colour palette for season creation */
const COLOR_PALETTE = [
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#EAB308', // yellow
  '#22C55E', // green
  '#14B8A6', // teal
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#78716C', // stone
  '#0EA5E9', // sky
]

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent'

/** Format a 0-indexed month + 1-indexed day → "MM-DD" MonthDay */
function toMonthDay(month: number, day: number): MonthDay {
  return `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` as MonthDay
}

/** Parse a MonthDay "MM-DD" to { month (0-indexed), day (1-indexed) } */
function parseMonthDay(md: MonthDay): { month: number; day: number } {
  const [m, d] = md.split('-').map(Number)
  return { month: m - 1, day: d }
}

/** Get how many days are in a month (use non-leap year for generic calendar) */
function daysInMonth(month: number): number {
  // Using 2024 as reference (leap year so Feb has 29)
  return new Date(2024, month + 1, 0).getDate()
}

/** Day of week for first day of month (0=Mon, 6=Sun) — ISO week */
function firstDayOfWeek(month: number): number {
  const d = new Date(2024, month, 1).getDay()
  return d === 0 ? 6 : d - 1 // Convert Sun=0..Sat=6 → Mon=0..Sun=6
}

/** Unique key for a day cell: "MM-DD" */
function dayKey(month: number, day: number): string {
  return toMonthDay(month, day)
}

/** Compare two MonthDay values numerically */
function monthDayToNum(md: string): number {
  const [m, d] = md.split('-').map(Number)
  return m * 100 + d
}

// ---------------------------------------------------------------------------
// Build a lookup map: dayKey → seasonId for fast rendering
// ---------------------------------------------------------------------------

function buildDayToSeasonMap(
  seasons: Record<string, SeasonDocument>
): Map<string, string> {
  const map = new Map<string, string>()

  for (const [seasonId, season] of Object.entries(seasons)) {
    for (const range of season.dateRanges) {
      const startNum = monthDayToNum(range.start)
      const endNum = monthDayToNum(range.end)

      if (startNum <= endNum) {
        // Non-wrapping: e.g. 06-01 → 09-30
        for (let m = 0; m < 12; m++) {
          for (let d = 1; d <= daysInMonth(m); d++) {
            const num = (m + 1) * 100 + d
            if (num >= startNum && num <= endNum) {
              map.set(dayKey(m, d), seasonId)
            }
          }
        }
      } else {
        // Wrapping: e.g. 12-20 → 01-05
        for (let m = 0; m < 12; m++) {
          for (let d = 1; d <= daysInMonth(m); d++) {
            const num = (m + 1) * 100 + d
            if (num >= startNum || num <= endNum) {
              map.set(dayKey(m, d), seasonId)
            }
          }
        }
      }
    }
  }

  return map
}

/**
 * After painting a range onto a season, remove overlapping days from other
 * seasons' dateRanges (auto-overwrite). This is the trickiest part:
 * we rebuild each other season's ranges by expanding them to day sets,
 * removing the painted days, and re-collapsing to contiguous ranges.
 */
function removeOverlappingDays(
  seasons: Record<string, SeasonDocument>,
  paintedSeasonId: string,
  paintedDays: Set<string>
): Record<string, SeasonDocument> {
  const updated = { ...seasons }

  for (const [sid, season] of Object.entries(updated)) {
    if (sid === paintedSeasonId) continue

    // Expand this season's ranges to a set of day keys
    const daySet = new Set<string>()
    for (const range of season.dateRanges) {
      const startNum = monthDayToNum(range.start)
      const endNum = monthDayToNum(range.end)

      if (startNum <= endNum) {
        for (let m = 0; m < 12; m++) {
          for (let d = 1; d <= daysInMonth(m); d++) {
            const num = (m + 1) * 100 + d
            if (num >= startNum && num <= endNum) {
              daySet.add(dayKey(m, d))
            }
          }
        }
      } else {
        for (let m = 0; m < 12; m++) {
          for (let d = 1; d <= daysInMonth(m); d++) {
            const num = (m + 1) * 100 + d
            if (num >= startNum || num <= endNum) {
              daySet.add(dayKey(m, d))
            }
          }
        }
      }
    }

    // Remove painted days
    let changed = false
    for (const pd of paintedDays) {
      if (daySet.has(pd)) {
        daySet.delete(pd)
        changed = true
      }
    }

    if (!changed) continue

    // Re-collapse to contiguous ranges
    updated[sid] = {
      ...season,
      dateRanges: collapseDaySetToRanges(daySet),
    }
  }

  return updated
}

/**
 * Collapse a set of "MM-DD" day keys into contiguous MonthDay ranges.
 * Days are sorted numerically and consecutive days form ranges.
 */
function collapseDaySetToRanges(daySet: Set<string>): { start: MonthDay; end: MonthDay }[] {
  if (daySet.size === 0) return []

  const sorted = Array.from(daySet).sort(
    (a, b) => monthDayToNum(a) - monthDayToNum(b)
  )

  const ranges: { start: MonthDay; end: MonthDay }[] = []
  let rangeStart = sorted[0]
  let prev = sorted[0]

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const prevParsed = parseMonthDay(prev as MonthDay)
    const currParsed = parseMonthDay(current as MonthDay)

    // Check if current is the next calendar day after prev
    const prevDate = new Date(2024, prevParsed.month, prevParsed.day)
    const nextDate = new Date(prevDate)
    nextDate.setDate(nextDate.getDate() + 1)

    if (
      nextDate.getMonth() === currParsed.month &&
      nextDate.getDate() === currParsed.day
    ) {
      // Contiguous
      prev = current
    } else {
      // Gap — close current range and start new one
      ranges.push({ start: rangeStart as MonthDay, end: prev as MonthDay })
      rangeStart = current
      prev = current
    }
  }

  // Close last range
  ranges.push({ start: rangeStart as MonthDay, end: prev as MonthDay })

  // Check if first and last range wrap around year boundary (Dec 31 → Jan 1)
  if (ranges.length >= 2) {
    const last = ranges[ranges.length - 1]
    const first = ranges[0]
    if (last.end === '12-31' && first.start === '01-01') {
      // Merge into a wrapping range
      ranges[ranges.length - 1] = { start: last.start, end: first.end }
      ranges.shift()
    }
  }

  return ranges
}

/**
 * Add a painted range to a season, expanding its dateRanges.
 * We expand existing ranges to a day set, add the new days, and re-collapse.
 */
function addRangeToSeason(
  season: SeasonDocument,
  startDay: string,
  endDay: string
): SeasonDocument {
  // Expand existing ranges
  const daySet = new Set<string>()
  for (const range of season.dateRanges) {
    const sNum = monthDayToNum(range.start)
    const eNum = monthDayToNum(range.end)

    if (sNum <= eNum) {
      for (let m = 0; m < 12; m++) {
        for (let d = 1; d <= daysInMonth(m); d++) {
          const num = (m + 1) * 100 + d
          if (num >= sNum && num <= eNum) {
            daySet.add(dayKey(m, d))
          }
        }
      }
    } else {
      for (let m = 0; m < 12; m++) {
        for (let d = 1; d <= daysInMonth(m); d++) {
          const num = (m + 1) * 100 + d
          if (num >= sNum || num <= eNum) {
            daySet.add(dayKey(m, d))
          }
        }
      }
    }
  }

  // Add new range days
  const sNum = monthDayToNum(startDay)
  const eNum = monthDayToNum(endDay)
  if (sNum <= eNum) {
    for (let m = 0; m < 12; m++) {
      for (let d = 1; d <= daysInMonth(m); d++) {
        const num = (m + 1) * 100 + d
        if (num >= sNum && num <= eNum) {
          daySet.add(dayKey(m, d))
        }
      }
    }
  } else {
    // Wrapping
    for (let m = 0; m < 12; m++) {
      for (let d = 1; d <= daysInMonth(m); d++) {
        const num = (m + 1) * 100 + d
        if (num >= sNum || num <= eNum) {
          daySet.add(dayKey(m, d))
        }
      }
    }
  }

  return {
    ...season,
    dateRanges: collapseDaySetToRanges(daySet),
  }
}

/**
 * Remove a single day from a season (eraser mode or clicking an assigned day).
 */
function removeDayFromSeason(
  season: SeasonDocument,
  day: string
): SeasonDocument {
  const daySet = new Set<string>()
  for (const range of season.dateRanges) {
    const sNum = monthDayToNum(range.start)
    const eNum = monthDayToNum(range.end)

    if (sNum <= eNum) {
      for (let m = 0; m < 12; m++) {
        for (let d = 1; d <= daysInMonth(m); d++) {
          const num = (m + 1) * 100 + d
          if (num >= sNum && num <= eNum) {
            daySet.add(dayKey(m, d))
          }
        }
      }
    } else {
      for (let m = 0; m < 12; m++) {
        for (let d = 1; d <= daysInMonth(m); d++) {
          const num = (m + 1) * 100 + d
          if (num >= sNum || num <= eNum) {
            daySet.add(dayKey(m, d))
          }
        }
      }
    }
  }

  daySet.delete(day)

  return {
    ...season,
    dateRanges: collapseDaySetToRanges(daySet),
  }
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

/** A single mini-month calendar grid */
function MiniMonth({
  month,
  dayToSeason,
  seasons,
  selectedSeasonId,
  selectionStart,
  hoverDay,
  onDayClick,
  onDayHover,
}: {
  month: number
  dayToSeason: Map<string, string>
  seasons: Record<string, SeasonDocument>
  selectedSeasonId: string | null
  selectionStart: string | null
  hoverDay: string | null
  onDayClick: (day: string) => void
  onDayHover: (day: string | null) => void
}) {
  const days = daysInMonth(month)
  const startDow = firstDayOfWeek(month)

  // Build preview range
  const previewDays = useMemo(() => {
    if (!selectionStart || !hoverDay || !selectedSeasonId) return new Set<string>()

    const sNum = monthDayToNum(selectionStart)
    const eNum = monthDayToNum(hoverDay)
    const set = new Set<string>()

    // Always paint from start to hover in chronological order
    const from = Math.min(sNum, eNum)
    const to = Math.max(sNum, eNum)

    for (let m = 0; m < 12; m++) {
      for (let d = 1; d <= daysInMonth(m); d++) {
        const num = (m + 1) * 100 + d
        if (num >= from && num <= to) {
          set.add(dayKey(m, d))
        }
      }
    }
    return set
  }, [selectionStart, hoverDay, selectedSeasonId])

  const cells: React.ReactNode[] = []

  // Empty leading cells
  for (let i = 0; i < startDow; i++) {
    cells.push(<div key={`empty-${i}`} className="w-7 h-7" />)
  }

  for (let d = 1; d <= days; d++) {
    const dk = dayKey(month, d)
    const ownerSeason = dayToSeason.get(dk)
    const ownerColor = ownerSeason ? seasons[ownerSeason]?.color : undefined
    const isPreview = previewDays.has(dk)
    const previewColor = selectedSeasonId ? seasons[selectedSeasonId]?.color : undefined
    const isSelectionStartDay = dk === selectionStart

    let bg = 'bg-gray-100'
    let textColor = 'text-gray-700'
    let border = ''
    let opacity = ''

    if (isPreview && previewColor) {
      bg = ''
      textColor = 'text-white'
      opacity = 'opacity-70'
    } else if (ownerColor) {
      bg = ''
      textColor = 'text-white'
    }

    if (isSelectionStartDay) {
      border = 'ring-2 ring-offset-1 ring-gray-900'
    }

    cells.push(
      <button
        key={d}
        type="button"
        className={`w-7 h-7 rounded text-xs font-medium transition-all
          ${bg} ${textColor} ${border} ${opacity}
          hover:ring-2 hover:ring-gray-400 hover:ring-offset-1
          flex items-center justify-center cursor-pointer`}
        style={{
          backgroundColor: isPreview && previewColor
            ? previewColor
            : ownerColor || undefined,
        }}
        onClick={() => onDayClick(dk)}
        onMouseEnter={() => onDayHover(dk)}
        title={`${MONTH_NAMES[month]} ${d}${ownerSeason ? ` — ${seasons[ownerSeason]?.label.en}` : ''}`}
      >
        {d}
      </button>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-3" onMouseLeave={() => onDayHover(null)}>
      <h3 className="text-sm font-semibold text-gray-700 mb-2 text-center">
        {MONTH_NAMES[month]}
      </h3>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAY_LABELS.map((label) => (
          <div key={label} className="w-7 h-5 text-[10px] font-medium text-gray-400 flex items-center justify-center">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function BackofficeSeasonsPage() {
  const [seasons, setSeasons] = useState<Record<string, SeasonDocument>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Selected season for painting
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null)
  // Selection start day (click-start)
  const [selectionStart, setSelectionStart] = useState<string | null>(null)
  // Hover day (for preview)
  const [hoverDay, setHoverDay] = useState<string | null>(null)

  // Create / edit modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSeason, setEditingSeason] = useState<string | null>(null) // null = create, string = edit id
  const [modalName, setModalName] = useState({ de: '', en: '' })
  const [modalColor, setModalColor] = useState(COLOR_PALETTE[0])

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Snapshot for dirty tracking
  const snapshotRef = useRef<string>('')

  useEffect(() => {
    loadSeasons()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Warn on unsaved changes
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  async function loadSeasons() {
    setLoading(true)
    try {
      const data = await fetchSeasons()
      setSeasons(data)
      snapshotRef.current = JSON.stringify(data)
      setDirty(false)

      // Auto-select first season if any
      const ids = Object.keys(data)
      if (ids.length > 0 && !selectedSeasonId) {
        setSelectedSeasonId(ids[0])
      }
    } catch (err) {
      console.error('Failed to load seasons:', err)
    } finally {
      setLoading(false)
    }
  }

  function markDirty(newSeasons: Record<string, SeasonDocument>) {
    setSeasons(newSeasons)
    setDirty(JSON.stringify(newSeasons) !== snapshotRef.current)
    setSaveMessage(null)
  }

  // ---- Day to season lookup ----
  const dayToSeason = useMemo(() => buildDayToSeasonMap(seasons), [seasons])

  // ---- Day click handler ----
  const handleDayClick = useCallback(
    (dk: string) => {
      if (!selectedSeasonId) return

      const existingOwner = dayToSeason.get(dk)

      // If clicking on a day owned by the selected season and no selection in progress → remove it
      if (!selectionStart && existingOwner === selectedSeasonId) {
        const season = seasons[selectedSeasonId]
        if (!season) return
        const updated = removeDayFromSeason(season, dk)
        markDirty({ ...seasons, [selectedSeasonId]: updated })
        return
      }

      // First click → set start
      if (!selectionStart) {
        setSelectionStart(dk)
        return
      }

      // Second click → paint range
      const startNum = monthDayToNum(selectionStart)
      const endNum = monthDayToNum(dk)
      const from = Math.min(startNum, endNum)
      const to = Math.max(startNum, endNum)

      // Collect painted days
      const paintedDays = new Set<string>()
      for (let m = 0; m < 12; m++) {
        for (let d = 1; d <= daysInMonth(m); d++) {
          const num = (m + 1) * 100 + d
          if (num >= from && num <= to) {
            paintedDays.add(dayKey(m, d))
          }
        }
      }

      const fromMD = from <= to ? selectionStart : dk
      const toMD = from <= to ? dk : selectionStart

      // Add range to selected season
      const season = seasons[selectedSeasonId]
      if (!season) {
        setSelectionStart(null)
        return
      }

      const updatedSeason = addRangeToSeason(season, fromMD, toMD)
      let updatedSeasons = { ...seasons, [selectedSeasonId]: updatedSeason }

      // Remove overlapping days from other seasons
      updatedSeasons = removeOverlappingDays(updatedSeasons, selectedSeasonId, paintedDays)

      markDirty(updatedSeasons)
      setSelectionStart(null)
    },
    [selectedSeasonId, selectionStart, seasons, dayToSeason]
  )

  // ---- Save all ----
  async function handleSave() {
    setSaving(true)
    setSaveMessage(null)
    try {
      // Save all seasons in parallel
      await Promise.all(
        Object.entries(seasons).map(([id, season]) =>
          setSeason(id, season)
        )
      )
      snapshotRef.current = JSON.stringify(seasons)
      setDirty(false)
      setSaveMessage('All seasons saved!')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (err) {
      console.error('Failed to save seasons:', err)
      alert('Failed to save. Check the console for details.')
    } finally {
      setSaving(false)
    }
  }

  // ---- Create / edit season ----
  function openCreateModal() {
    setEditingSeason(null)
    setModalName({ de: '', en: '' })
    // Pick first unused color from palette
    const usedColors = new Set(Object.values(seasons).map((s) => s.color))
    const freeColor = COLOR_PALETTE.find((c) => !usedColors.has(c)) ?? COLOR_PALETTE[0]
    setModalColor(freeColor)
    setShowCreateModal(true)
  }

  function openEditModal(seasonId: string) {
    const season = seasons[seasonId]
    if (!season) return
    setEditingSeason(seasonId)
    setModalName({ ...season.label })
    setModalColor(season.color)
    setShowCreateModal(true)
  }

  function handleModalSave() {
    if (editingSeason) {
      // Edit existing
      const season = seasons[editingSeason]
      if (!season) return
      const updated = {
        ...season,
        label: { ...modalName },
        color: modalColor,
      }
      markDirty({ ...seasons, [editingSeason]: updated })
    } else {
      // Create new
      const id = modalName.en
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      if (!id) {
        alert('Please enter an English name for the season.')
        return
      }
      if (seasons[id]) {
        alert(`A season with ID "${id}" already exists. Choose a different name.`)
        return
      }
      const newSeason: SeasonDocument = {
        id,
        label: { ...modalName },
        color: modalColor,
        dateRanges: [],
      }
      const updated = { ...seasons, [id]: newSeason }
      markDirty(updated)
      setSelectedSeasonId(id)
    }
    setShowCreateModal(false)
  }

  // ---- Delete season ----
  async function handleDelete(seasonId: string) {
    try {
      // Delete from Firestore immediately
      await deleteSeason(seasonId)

      const updated = { ...seasons }
      delete updated[seasonId]
      setSeasons(updated)
      snapshotRef.current = JSON.stringify(updated)
      setDirty(false)

      if (selectedSeasonId === seasonId) {
        const remaining = Object.keys(updated)
        setSelectedSeasonId(remaining.length > 0 ? remaining[0] : null)
      }
    } catch (err) {
      console.error('Failed to delete season:', err)
      alert('Failed to delete season.')
    } finally {
      setDeleteConfirm(null)
    }
  }

  // ---- Cancel selection on Escape ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectionStart(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ---- Render ----

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Seasons</h1>
        <p className="text-gray-500">Loading seasons…</p>
      </div>
    )
  }

  const seasonIds = Object.keys(seasons)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Seasons</h1>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-sm text-green-600 font-medium">{saveMessage}</span>
          )}
          {dirty && !saveMessage && (
            <span className="text-sm text-amber-600 font-medium">Unsaved changes</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="px-5 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-light transition-colors disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save All'}
          </button>
        </div>
      </div>

      {/* Season list */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Seasons ({seasonIds.length})
          </h2>
          <button
            onClick={openCreateModal}
            className="text-sm text-accent hover:underline font-medium"
          >
            + Add Season
          </button>
        </div>

        {seasonIds.length === 0 ? (
          <p className="text-sm text-gray-500">
            No seasons created yet. Add one to get started.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {seasonIds.map((sid) => {
              const season = seasons[sid]
              const isSelected = selectedSeasonId === sid
              return (
                <button
                  key={sid}
                  type="button"
                  onClick={() => {
                    setSelectedSeasonId(sid)
                    setSelectionStart(null) // reset any in-progress selection
                  }}
                  className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border-2
                    ${isSelected
                      ? 'border-gray-900 shadow-md'
                      : 'border-transparent hover:border-gray-300'
                    }
                  `}
                  style={{
                    backgroundColor: isSelected
                      ? season.color + '20' // 12% opacity
                      : '#f3f4f6',
                  }}
                >
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0 border border-white shadow-sm"
                    style={{ backgroundColor: season.color }}
                  />
                  <span className="text-gray-900">{season.label.en}</span>
                  {/* Edit / Delete buttons on hover */}
                  <span className="ml-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditModal(sid)
                      }}
                      className="text-gray-400 hover:text-gray-700 cursor-pointer text-xs"
                      title="Edit"
                    >
                      ✏️
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirm(sid)
                      }}
                      className="text-gray-400 hover:text-red-500 cursor-pointer text-xs"
                      title="Delete"
                    >
                      🗑️
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Selection instructions */}
        {selectedSeasonId && (
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: seasons[selectedSeasonId]?.color }}
            />
            <span>
              <strong>{seasons[selectedSeasonId]?.label.en}</strong> selected
              {selectionStart
                ? ' — click another day to complete the range (Esc to cancel)'
                : ' — click a day to start selecting a range, or click an assigned day to remove it'}
            </span>
          </div>
        )}

        {!selectedSeasonId && seasonIds.length > 0 && (
          <p className="mt-3 text-xs text-gray-500">
            Select a season above, then paint date ranges on the calendar below.
          </p>
        )}
      </div>

      {/* Year Calendar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 12 }, (_, month) => (
          <MiniMonth
            key={month}
            month={month}
            dayToSeason={dayToSeason}
            seasons={seasons}
            selectedSeasonId={selectedSeasonId}
            selectionStart={selectionStart}
            hoverDay={hoverDay}
            onDayClick={handleDayClick}
            onDayHover={setHoverDay}
          />
        ))}
      </div>

      {/* Legend */}
      {seasonIds.length > 0 && (
        <div className="mt-4 bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Legend</h3>
          <div className="flex flex-wrap gap-4 items-center">
            {seasonIds.map((sid) => {
              const season = seasons[sid]
              // Count assigned days
              let count = 0
              for (const [, owner] of dayToSeason) {
                if (owner === sid) count++
              }
              return (
                <div key={sid} className="flex items-center gap-1.5 text-sm text-gray-700">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: season.color }}
                  />
                  {season.label.en}
                  <span className="text-gray-400 text-xs">({count} days)</span>
                </div>
              )
            })}
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <span className="w-3 h-3 rounded-full bg-gray-200" />
              Default
              <span className="text-gray-400 text-xs">
                ({366 - dayToSeason.size} days)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingSeason ? 'Edit Season' : 'New Season'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name (EN)
                </label>
                <input
                  type="text"
                  value={modalName.en}
                  onChange={(e) => setModalName((prev) => ({ ...prev, en: e.target.value }))}
                  placeholder="e.g. High Season"
                  className={inputCls}
                  disabled={!!editingSeason} // Can't rename ID
                />
                {!editingSeason && modalName.en && (
                  <p className="text-xs text-gray-400 mt-1">
                    ID: {modalName.en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name (DE)
                </label>
                <input
                  type="text"
                  value={modalName.de}
                  onChange={(e) => setModalName((prev) => ({ ...prev, de: e.target.value }))}
                  placeholder="e.g. Hochsaison"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setModalColor(color)}
                      className={`w-8 h-8 rounded-full transition-all ${
                        modalColor === color
                          ? 'ring-2 ring-offset-2 ring-gray-900 scale-110'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSave}
                className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-light transition-colors"
              >
                {editingSeason ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete season?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete{' '}
              <strong>{seasons[deleteConfirm]?.label.en ?? deleteConfirm}</strong>?
              All date range assignments for this season will be lost.
              Apartment minimum-night overrides referencing this season will no longer apply.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
