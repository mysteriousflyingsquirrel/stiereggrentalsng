'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Apartment } from '@/data/apartments'
import {
  fetchApartmentBySlug,
  createApartment,
  updateApartment,
} from '@/lib/apartmentService'
import { uploadImage, uploadBigImage } from '@/lib/imageService'
import { useSeasons } from '@/hooks/useSeasons'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyApartment(): Apartment {
  return {
    id: '',
    slug: '',
    name: { de: '', en: '' },
    longDescription: { de: '', en: '' },
    images: [],
    facts: { guests: 2, bedrooms: 1, bathrooms: 1 },
    amenities: { de: [], en: [] },
    location: { lat: 46.624, lng: 8.032, label: 'Grindelwald' },
    bookingLinks: [],
    icalUrls: [],
    priceFrom: undefined,
    minNights: {},
  }
}

/** Generate a URL-safe slug from a string. */
function toSlug(s: string) {
  return s
    .toLowerCase()
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ---------------------------------------------------------------------------
// Collapsible section
// ---------------------------------------------------------------------------

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-6 pb-6 border-t border-gray-100 pt-4">{children}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Reusable form inputs
// ---------------------------------------------------------------------------

function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  )
}

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent'
const textareaCls = `${inputCls} min-h-[100px] resize-y`

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function ApartmentEditPage() {
  const params = useParams()
  const router = useRouter()
  const slugParam = params.slug as string
  const isNew = slugParam === 'new'

  const { seasons, loading: seasonsLoading } = useSeasons()

  const [apt, setApt] = useState<Apartment>(emptyApartment())
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Image upload state
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ---- Load existing apartment ----
  useEffect(() => {
    if (isNew) return
    ;(async () => {
      try {
        const data = await fetchApartmentBySlug(slugParam)
        if (data) {
          setApt(data)
        } else {
          router.replace('/backoffice/apartments')
        }
      } catch (err) {
        console.error('Failed to load apartment:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [slugParam, isNew, router])

  // ---- Unsaved changes warning ----
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  // ---- Helpers to mutate state ----
  function update(patch: Partial<Apartment>) {
    setApt((prev) => ({ ...prev, ...patch }))
    setDirty(true)
    setSaveMessage(null)
  }

  function updateFacts(patch: Partial<Apartment['facts']>) {
    setApt((prev) => ({ ...prev, facts: { ...prev.facts, ...patch } }))
    setDirty(true)
    setSaveMessage(null)
  }

  function updateLocation(patch: Partial<Apartment['location']>) {
    setApt((prev) => ({ ...prev, location: { ...prev.location, ...patch } }))
    setDirty(true)
    setSaveMessage(null)
  }

  function updateMinNights(patch: Record<string, number | undefined>) {
    setApt((prev) => ({
      ...prev,
      minNights: { ...prev.minNights, ...patch },
    }))
    setDirty(true)
    setSaveMessage(null)
  }

  // ---- Save ----
  async function handleSave() {
    if (!apt.slug) {
      alert('Slug is required')
      return
    }
    if (!apt.name.de) {
      alert('Name (DE) is required')
      return
    }

    setSaving(true)
    setSaveMessage(null)
    try {
      if (isNew) {
        const newApt = { ...apt, id: apt.slug }
        await createApartment(newApt)
        setDirty(false)
        router.replace(`/backoffice/apartments/${apt.slug}`)
      } else {
        await updateApartment(slugParam, apt)
        setDirty(false)
        setSaveMessage('Saved successfully!')
        setTimeout(() => setSaveMessage(null), 3000)
      }
    } catch (err) {
      console.error('Failed to save apartment:', err)
      alert('Failed to save apartment. Check the console for details.')
    } finally {
      setSaving(false)
    }
  }

  // ---- Image upload ----
  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0 || !apt.slug) return

    setUploading(true)
    try {
      const newImages = [...apt.images]

      for (const file of Array.from(files)) {
        // Upload as both thumbnail and big version
        const [thumbUrl, bigUrl] = await Promise.all([
          uploadImage(file, apt.slug),
          uploadBigImage(file, apt.slug),
        ])

        newImages.push({
          src: thumbUrl,
          srcBig: bigUrl,
          alt: file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
        })
      }

      update({ images: newImages })
    } catch (err) {
      console.error('Failed to upload images:', err)
      alert('Failed to upload one or more images.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removeImage(index: number) {
    const newImages = apt.images.filter((_, i) => i !== index)
    update({ images: newImages })
  }

  function moveImage(index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= apt.images.length) return
    const newImages = [...apt.images]
    ;[newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]]
    update({ images: newImages })
  }

  function updateImageAlt(index: number, alt: string) {
    const newImages = [...apt.images]
    newImages[index] = { ...newImages[index], alt }
    update({ images: newImages })
  }

  // ---- Amenity helpers ----
  function addAmenity(locale: 'de' | 'en', value: string) {
    if (!value.trim()) return
    const current = apt.amenities[locale]
    if (current.includes(value.trim())) return
    update({
      amenities: {
        ...apt.amenities,
        [locale]: [...current, value.trim()],
      },
    })
  }

  function removeAmenity(locale: 'de' | 'en', index: number) {
    update({
      amenities: {
        ...apt.amenities,
        [locale]: apt.amenities[locale].filter((_, i) => i !== index),
      },
    })
  }

  // ---- Booking link helpers ----
  function addBookingLink() {
    update({ bookingLinks: [...apt.bookingLinks, { label: '', url: '' }] })
  }

  function updateBookingLink(index: number, field: 'label' | 'url', value: string) {
    const newLinks = [...apt.bookingLinks]
    newLinks[index] = { ...newLinks[index], [field]: value }
    update({ bookingLinks: newLinks })
  }

  function removeBookingLink(index: number) {
    update({ bookingLinks: apt.bookingLinks.filter((_, i) => i !== index) })
  }

  // ---- iCal URL helpers ----
  function addIcalUrl() {
    update({ icalUrls: [...apt.icalUrls, ''] })
  }

  function updateIcalUrl(index: number, value: string) {
    const newUrls = [...apt.icalUrls]
    newUrls[index] = value
    update({ icalUrls: newUrls })
  }

  function removeIcalUrl(index: number) {
    update({ icalUrls: apt.icalUrls.filter((_, i) => i !== index) })
  }

  // ---- Loading state ----
  if (loading || seasonsLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Loading…</h1>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (dirty && !confirm('You have unsaved changes. Discard?')) return
              router.push('/backoffice/apartments')
            }}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? 'New Apartment' : `Edit: ${apt.name.de || apt.slug}`}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-sm text-green-600 font-medium">{saveMessage}</span>
          )}
          {dirty && !saveMessage && (
            <span className="text-sm text-amber-600 font-medium">Unsaved changes</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-light transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* ============================================================ */}
        {/* Section A — Basic Info                                       */}
        {/* ============================================================ */}
        <Section title="Basic Info">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Slug (URL identifier)">
              <input
                type="text"
                value={apt.slug}
                onChange={(e) => update({ slug: toSlug(e.target.value), id: toSlug(e.target.value) })}
                disabled={!isNew}
                placeholder="e.g. chalet-wega"
                className={`${inputCls} ${!isNew ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
              />
            </Field>
            <Field label="Price from (CHF)">
              <input
                type="number"
                value={apt.priceFrom ?? ''}
                onChange={(e) =>
                  update({ priceFrom: e.target.value ? Number(e.target.value) : undefined })
                }
                placeholder="e.g. 380"
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Field label="Name (DE)">
              <input
                type="text"
                value={apt.name.de}
                onChange={(e) => update({ name: { ...apt.name, de: e.target.value } })}
                placeholder="Chalet Walt Apartment Wega"
                className={inputCls}
              />
            </Field>
            <Field label="Name (EN)">
              <input
                type="text"
                value={apt.name.en}
                onChange={(e) => update({ name: { ...apt.name, en: e.target.value } })}
                placeholder="Chalet Walt Apartment Wega"
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Field label="Description (DE)">
              <textarea
                value={apt.longDescription?.de ?? ''}
                onChange={(e) =>
                  update({
                    longDescription: {
                      de: e.target.value,
                      en: apt.longDescription?.en ?? '',
                    },
                  })
                }
                className={textareaCls}
              />
            </Field>
            <Field label="Description (EN)">
              <textarea
                value={apt.longDescription?.en ?? ''}
                onChange={(e) =>
                  update({
                    longDescription: {
                      de: apt.longDescription?.de ?? '',
                      en: e.target.value,
                    },
                  })
                }
                className={textareaCls}
              />
            </Field>
          </div>
        </Section>

        {/* ============================================================ */}
        {/* Section B — Facts                                            */}
        {/* ============================================================ */}
        <Section title="Facts">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Guests">
              <input
                type="number"
                min={1}
                value={apt.facts.guests}
                onChange={(e) => updateFacts({ guests: Number(e.target.value) })}
                className={inputCls}
              />
            </Field>
            <Field label="Bedrooms">
              <input
                type="number"
                min={0}
                value={apt.facts.bedrooms}
                onChange={(e) => updateFacts({ bedrooms: Number(e.target.value) })}
                className={inputCls}
              />
            </Field>
            <Field label="Bathrooms">
              <input
                type="number"
                min={0}
                value={apt.facts.bathrooms}
                onChange={(e) => updateFacts({ bathrooms: Number(e.target.value) })}
                className={inputCls}
              />
            </Field>
            <Field label="Double Beds">
              <input
                type="number"
                min={0}
                value={apt.facts.doubleBeds ?? ''}
                onChange={(e) =>
                  updateFacts({
                    doubleBeds: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className={inputCls}
              />
            </Field>
            <Field label="Single Beds">
              <input
                type="number"
                min={0}
                value={apt.facts.singleBeds ?? ''}
                onChange={(e) =>
                  updateFacts({
                    singleBeds: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className={inputCls}
              />
            </Field>
            <Field label="Size (m²)">
              <input
                type="number"
                min={0}
                value={apt.facts.sqm ?? ''}
                onChange={(e) =>
                  updateFacts({ sqm: e.target.value ? Number(e.target.value) : undefined })
                }
                className={inputCls}
              />
            </Field>
          </div>
        </Section>

        {/* ============================================================ */}
        {/* Section C — Images                                           */}
        {/* ============================================================ */}
        <Section title={`Images (${apt.images.length})`}>
          {/* Upload button */}
          <div className="mb-4">
            {apt.slug ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-medium text-accent border border-accent rounded-lg hover:bg-accent/5 transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Uploading…' : '+ Upload Images'}
                </button>
              </>
            ) : (
              <p className="text-sm text-amber-600">
                Save the apartment first (set a slug) before uploading images.
              </p>
            )}
          </div>

          {/* Image grid */}
          {apt.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {apt.images.map((img, i) => (
                <div
                  key={`${img.src}-${i}`}
                  className="group relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
                >
                  <div className="relative w-full aspect-[4/3]">
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  </div>

                  {/* Controls overlay */}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => moveImage(i, -1)}
                        className="w-6 h-6 flex items-center justify-center bg-white/90 rounded text-xs shadow hover:bg-white"
                        title="Move left"
                      >
                        ←
                      </button>
                    )}
                    {i < apt.images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveImage(i, 1)}
                        className="w-6 h-6 flex items-center justify-center bg-white/90 rounded text-xs shadow hover:bg-white"
                        title="Move right"
                      >
                        →
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="w-6 h-6 flex items-center justify-center bg-red-500/90 text-white rounded text-xs shadow hover:bg-red-600"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Alt text */}
                  <div className="p-2">
                    <input
                      type="text"
                      value={img.alt}
                      onChange={(e) => updateImageAlt(i, e.target.value)}
                      placeholder="Alt text"
                      className="w-full text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  {/* Position indicator */}
                  <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {i + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ============================================================ */}
        {/* Section D — Amenities                                        */}
        {/* ============================================================ */}
        <Section title="Amenities">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['de', 'en'] as const).map((locale) => (
              <div key={locale}>
                <h3 className="text-sm font-medium text-gray-700 mb-2 uppercase">
                  {locale === 'de' ? 'Deutsch' : 'English'}
                </h3>

                {/* Chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {apt.amenities[locale].map((amenity, i) => (
                    <span
                      key={`${amenity}-${i}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-sm rounded-full"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => removeAmenity(locale, i)}
                        className="text-gray-400 hover:text-red-500 ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add input */}
                <AmenityAdder onAdd={(val) => addAmenity(locale, val)} />
              </div>
            ))}
          </div>
        </Section>

        {/* ============================================================ */}
        {/* Section E — Location                                         */}
        {/* ============================================================ */}
        <Section title="Location" defaultOpen={false}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Latitude">
              <input
                type="number"
                step="any"
                value={apt.location.lat}
                onChange={(e) => updateLocation({ lat: Number(e.target.value) })}
                className={inputCls}
              />
            </Field>
            <Field label="Longitude">
              <input
                type="number"
                step="any"
                value={apt.location.lng}
                onChange={(e) => updateLocation({ lng: Number(e.target.value) })}
                className={inputCls}
              />
            </Field>
            <Field label="Label">
              <input
                type="text"
                value={apt.location.label ?? ''}
                onChange={(e) => updateLocation({ label: e.target.value || undefined })}
                placeholder="Grindelwald"
                className={inputCls}
              />
            </Field>
          </div>
        </Section>

        {/* ============================================================ */}
        {/* Section F — Booking & Availability                           */}
        {/* ============================================================ */}
        <Section title="Booking & Availability" defaultOpen={false}>
          {/* Booking Links */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Booking Links</h3>
              <button
                type="button"
                onClick={addBookingLink}
                className="text-xs text-accent hover:underline"
              >
                + Add Link
              </button>
            </div>
            <div className="space-y-2">
              {apt.bookingLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => updateBookingLink(i, 'label', e.target.value)}
                    placeholder="Label"
                    className={`${inputCls} w-40 flex-shrink-0`}
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => updateBookingLink(i, 'url', e.target.value)}
                    placeholder="https://..."
                    className={`${inputCls} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => removeBookingLink(i)}
                    className="text-red-400 hover:text-red-600 flex-shrink-0 px-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {apt.bookingLinks.length === 0 && (
                <p className="text-sm text-gray-400">No booking links yet.</p>
              )}
            </div>
          </div>

          {/* iCal URLs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">iCal URLs</h3>
              <button
                type="button"
                onClick={addIcalUrl}
                className="text-xs text-accent hover:underline"
              >
                + Add URL
              </button>
            </div>
            <div className="space-y-2">
              {apt.icalUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateIcalUrl(i, e.target.value)}
                    placeholder="https://..."
                    className={`${inputCls} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => removeIcalUrl(i)}
                    className="text-red-400 hover:text-red-600 flex-shrink-0 px-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {apt.icalUrls.length === 0 && (
                <p className="text-sm text-gray-400">No iCal URLs yet.</p>
              )}
            </div>
          </div>
        </Section>

        {/* ============================================================ */}
        {/* Section G — Minimum Nights (dynamic from Firestore seasons)  */}
        {/* ============================================================ */}
        <Section title="Minimum Nights" defaultOpen={false}>
          {/* Default minimum nights — always visible */}
          <div className="mb-4">
            <Field label="Default (days not covered by any season)">
              <input
                type="number"
                min={1}
                value={apt.minNightsDefault ?? ''}
                onChange={(e) => {
                  update({
                    minNightsDefault: e.target.value ? Number(e.target.value) : undefined,
                  })
                }}
                placeholder="e.g. 3"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Per-season overrides */}
          {seasons && Object.keys(seasons).length > 0 ? (
            <>
              <p className="text-xs text-gray-500 mb-3">
                Override minimum nights for specific seasons. Leave blank to use the default.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(seasons).map((season) => (
                  <Field
                    key={season.id}
                    label={`${season.label.en}`}
                    className="relative"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: season.color }}
                      />
                      <input
                        type="number"
                        min={1}
                        value={apt.minNights?.[season.id] ?? ''}
                        onChange={(e) =>
                          updateMinNights({
                            [season.id]: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        placeholder={apt.minNightsDefault ? `default: ${apt.minNightsDefault}` : 'e.g. 7'}
                        className={inputCls}
                      />
                    </div>
                  </Field>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 mt-2">
              No seasons configured yet.{' '}
              <a href="/backoffice/seasons" className="text-accent hover:underline">
                Create seasons to add per-season overrides →
              </a>
            </p>
          )}
        </Section>
      </div>

      {/* Sticky bottom save bar */}
      <div className="sticky bottom-0 mt-6 -mx-8 px-8 py-4 bg-gray-100/95 backdrop-blur border-t border-gray-200 flex items-center justify-between">
        <button
          onClick={() => {
            if (dirty && !confirm('You have unsaved changes. Discard?')) return
            router.push('/backoffice/apartments')
          }}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-sm text-green-600 font-medium">{saveMessage}</span>
          )}
          {dirty && !saveMessage && (
            <span className="text-sm text-amber-600">Unsaved changes</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-light transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : isNew ? 'Create Apartment' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small sub-component for adding amenities
// ---------------------------------------------------------------------------

function AmenityAdder({ onAdd }: { onAdd: (val: string) => void }) {
  const [value, setValue] = useState('')

  function handleAdd() {
    if (value.trim()) {
      onAdd(value.trim())
      setValue('')
    }
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleAdd()
          }
        }}
        placeholder="Add amenity…"
        className={`${inputCls} flex-1`}
      />
      <button
        type="button"
        onClick={handleAdd}
        className="px-3 py-2 text-sm font-medium text-accent border border-accent rounded-lg hover:bg-accent/5 transition-colors"
      >
        Add
      </button>
    </div>
  )
}
