import { NextResponse } from 'next/server'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { apartments } from '@/data/apartments'
import * as fs from 'fs'
import * as path from 'path'

/**
 * One-time seed endpoint to upload all local images to Firebase Storage
 * and update Firestore apartment documents with the Storage URLs.
 *
 * GET /api/seed-images
 *
 * ⚠️ This can take a while (~140 images). Remove or protect after use!
 */
export async function GET() {
  const results: string[] = []
  const publicDir = path.join(process.cwd(), 'public')

  try {
    for (const apartment of apartments) {
      const slug = apartment.slug
      const docRef = doc(db, 'apartments', slug)
      const existing = await getDoc(docRef)

      if (!existing.exists()) {
        results.push(`⏭️  apartments/${slug} not found in Firestore, skipping`)
        continue
      }

      const existingData = existing.data()
      const existingImages = existingData.images || []

      // Check if already migrated (first image src starts with http)
      if (
        existingImages.length > 0 &&
        existingImages[0].src?.startsWith('https://')
      ) {
        results.push(`⏭️  apartments/${slug} images already migrated, skipping`)
        continue
      }

      const updatedImages: { src: string; srcBig?: string; alt: string }[] = []

      for (const image of apartment.images) {
        // --- Upload thumbnail ---
        const thumbLocalPath = path.join(publicDir, image.src)
        let thumbUrl = image.src // fallback to local path

        if (fs.existsSync(thumbLocalPath)) {
          const thumbBytes = fs.readFileSync(thumbLocalPath)
          // Storage path: images/{apartment}/{filename}
          const thumbStoragePath = image.src.replace(/^\//, '') // strip leading /
          const thumbRef = ref(storage, thumbStoragePath)
          await uploadBytes(thumbRef, thumbBytes, {
            contentType: 'image/jpeg',
          })
          thumbUrl = await getDownloadURL(thumbRef)
          results.push(`  📤 ${thumbStoragePath}`)
        } else {
          results.push(`  ⚠️  Thumbnail not found: ${thumbLocalPath}`)
        }

        // --- Upload big image ---
        const bigPath = deriveBigImagePath(image.src)
        const bigLocalPath = path.join(publicDir, bigPath)
        let bigUrl: string | undefined

        if (fs.existsSync(bigLocalPath)) {
          const bigBytes = fs.readFileSync(bigLocalPath)
          const bigStoragePath = bigPath.replace(/^\//, '')
          const bigRef = ref(storage, bigStoragePath)
          await uploadBytes(bigRef, bigBytes, {
            contentType: 'image/jpeg',
          })
          bigUrl = await getDownloadURL(bigRef)
          results.push(`  📤 ${bigStoragePath}`)
        } else {
          results.push(`  ⚠️  Big image not found: ${bigLocalPath}`)
        }

        updatedImages.push({
          src: thumbUrl,
          ...(bigUrl ? { srcBig: bigUrl } : {}),
          alt: image.alt,
        })
      }

      // Update Firestore document with Storage URLs
      await updateDoc(docRef, { images: updatedImages })
      results.push(`✅  apartments/${slug} — ${updatedImages.length} images migrated`)
    }

    return NextResponse.json({
      success: true,
      message: 'Image seed completed',
      results,
    })
  } catch (error) {
    console.error('Image seed failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results,
      },
      { status: 500 }
    )
  }
}

/**
 * Derive the big image path from the thumbnail path.
 *
 * Examples:
 *   /images/wega/cwaw_wohnzimmer_768px.jpg  → /images_big/wega/cwaw_wohnzimmer.jpg
 *   /images/wega/cwaw_aussen_768px.jpg      → /images_big/wega/cwaw_aussen_1.JPG
 */
function deriveBigImagePath(thumbPath: string): string {
  // Replace folder
  let bigPath = thumbPath.replace('/images/', '/images_big/')

  // Remove _768px suffix
  bigPath = bigPath.replace(/_768px\.(jpg|jpeg|png|webp)$/i, '.$1')

  // Special case for cwaw_aussen
  if (bigPath.includes('cwaw_aussen.jpg')) {
    bigPath = bigPath.replace('cwaw_aussen.jpg', 'cwaw_aussen_1.JPG')
  } else {
    // Normalize extension to lowercase
    bigPath = bigPath.replace(
      /\.(JPG|JPEG|PNG|WEBP)$/,
      (match) => match.toLowerCase()
    )
  }

  return bigPath
}
