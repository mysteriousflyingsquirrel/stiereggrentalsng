export function parseApartmentName(fullName: string): {
  title: string
  subtitle: string | null
} {
  const apartmentMatch = fullName.match(/^(.+?)\s+(Apartment|Studio)\s+(.+)$/)
  if (apartmentMatch) {
    return {
      title: apartmentMatch[1].trim(),
      subtitle: `${apartmentMatch[2]} ${apartmentMatch[3]}`.trim(),
    }
  }

  const chezBrigitteMatch = fullName.match(/^Chalet Chez Brigitte\s+(.+)$/)
  if (chezBrigitteMatch) {
    return {
      title: 'Chalet Chez Brigitte',
      subtitle: chezBrigitteMatch[1].trim(),
    }
  }

  return { title: fullName, subtitle: null }
}
