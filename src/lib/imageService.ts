import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage'
import { storage } from './firebase'

/**
 * Upload an image file to Firebase Storage under the apartment's folder.
 * Returns the public download URL.
 */
export async function uploadImage(
  file: File,
  apartmentSlug: string,
  filename?: string
): Promise<string> {
  const name = filename || `${Date.now()}_${file.name}`
  const storageRef = ref(storage, `images/${apartmentSlug}/${name}`)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

/**
 * Upload a big (high-res) image to Firebase Storage.
 */
export async function uploadBigImage(
  file: File,
  apartmentSlug: string,
  filename?: string
): Promise<string> {
  const name = filename || `${Date.now()}_${file.name}`
  const storageRef = ref(storage, `images_big/${apartmentSlug}/${name}`)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

/**
 * Delete an image from Firebase Storage by its full storage path.
 */
export async function deleteImage(storagePath: string): Promise<void> {
  const storageRef = ref(storage, storagePath)
  await deleteObject(storageRef)
}

/**
 * List all images in a folder for an apartment.
 */
export async function listApartmentImages(
  apartmentSlug: string,
  folder: 'images' | 'images_big' = 'images'
): Promise<string[]> {
  const folderRef = ref(storage, `${folder}/${apartmentSlug}`)
  const result = await listAll(folderRef)
  return Promise.all(result.items.map((item) => getDownloadURL(item)))
}
