/**
 * Map a thumbnail path (/images/...) to its full-size counterpart (/images_big/...).
 */
export function resolveBigImagePath(originalPath: string): string {
  const pathMatch = originalPath.match(/\/images\/([^/]+)\/([^/]+)$/)

  if (!pathMatch) {
    return originalPath.replace('/images/', '/images_big/').replace(/_768px\./, '.')
  }

  const [, folder, filename] = pathMatch
  let bigFilename = filename.replace(/_768px\.(jpg|jpeg|png|webp)$/i, '.$1')

  if (bigFilename === 'cwaw_aussen.jpg') {
    bigFilename = 'cwaw_aussen_1.JPG'
  } else if (folder === 'magicmountain') {
    bigFilename = bigFilename.replace(/\.(jpg|jpeg)$/i, '.png')
    if (bigFilename === 'Winter.png') {
      bigFilename = 'Winter.JPG'
    }
  } else {
    bigFilename = bigFilename.replace(/\.(JPG|JPEG|PNG|WEBP)$/i, (match) => match.toLowerCase())
  }

  return `/images_big/${folder}/${bigFilename}`
}
