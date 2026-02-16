'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Apartment } from '@/data/apartments'
import { fetchApartments, deleteApartment } from '@/lib/apartmentService'

export default function BackofficeApartmentsPage() {
  const router = useRouter()
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    loadApartments()
  }, [])

  async function loadApartments() {
    setLoading(true)
    try {
      const data = await fetchApartments()
      setApartments(data)
    } catch (err) {
      console.error('Failed to load apartments:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(slug: string) {
    setDeleting(slug)
    try {
      await deleteApartment(slug)
      setApartments((prev) => prev.filter((a) => a.slug !== slug))
    } catch (err) {
      console.error('Failed to delete apartment:', err)
      alert('Failed to delete apartment')
    } finally {
      setDeleting(null)
      setShowDeleteConfirm(null)
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Apartments</h1>
        <p className="text-gray-500">Loading apartments…</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Apartments{' '}
          <span className="text-base font-normal text-gray-500">
            ({apartments.length})
          </span>
        </h1>
        <Link
          href="/backoffice/apartments/new"
          className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-light transition-colors"
        >
          + Add Apartment
        </Link>
      </div>

      {/* Table */}
      {apartments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500 mb-4">No apartments yet.</p>
          <Link
            href="/backoffice/apartments/new"
            className="text-accent font-medium hover:underline"
          >
            Create your first apartment →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Apartment
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 hidden md:table-cell">
                  Guests
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 hidden md:table-cell">
                  Bedrooms
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">
                  m²
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 hidden md:table-cell">
                  Price from
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {apartments.map((apt) => (
                <tr
                  key={apt.slug}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() =>
                    router.push(`/backoffice/apartments/${apt.slug}`)
                  }
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {/* Thumbnail */}
                      <div className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        {apt.images[0] && (
                          <Image
                            src={apt.images[0].src}
                            alt={apt.images[0].alt}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {apt.name.de}
                        </p>
                        <p className="text-xs text-gray-400">{apt.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell">
                    {apt.facts.guests}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell">
                    {apt.facts.bedrooms}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 hidden lg:table-cell">
                    {apt.facts.sqm ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell">
                    {apt.priceFrom ? `CHF ${apt.priceFrom}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div
                      className="flex items-center justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href={`/backoffice/apartments/${apt.slug}`}
                        className="px-3 py-1.5 text-xs font-medium text-accent bg-accent/5 rounded-lg hover:bg-accent/10 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setShowDeleteConfirm(apt.slug)}
                        disabled={deleting === apt.slug}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {deleting === apt.slug ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Delete apartment?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete{' '}
              <strong>
                {apartments.find((a) => a.slug === showDeleteConfirm)?.name
                  .de ?? showDeleteConfirm}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={deleting !== null}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
