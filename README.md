# Stieregg Rentals - Next.js Website

A modern, luxury holiday apartment rental website for Grindelwald, Switzerland, built with Next.js 14, TypeScript, and Tailwind CSS.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Leaflet + React-Leaflet** (for map functionality)
- **node-ical** (for iCal parsing)
- **Next Image** (for optimized images)
- **ESLint + Prettier**

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
stiereggrentalsng/
├── public/
│   ├── images/          # Apartment images
│   └── icons/           # Logo and UI icons
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── layout.tsx   # Root layout
│   │   ├── page.tsx     # Home page
│   │   ├── about/       # About page
│   │   ├── apartments/  # Apartment detail pages
│   │   └── api/         # API routes
│   ├── components/      # React components
│   ├── data/            # Data models and seed data
│   └── lib/             # Utility functions
└── package.json
```

## How to Add Apartments

### 1. Add Apartment Data

Edit `src/data/apartments.ts` and add a new apartment object to the `apartments` array:

```typescript
{
  id: 'unique-id',
  slug: 'url-friendly-slug',
  name: {
    de: 'German Name',
    en: 'English Name',
  },
  shortDescription: {
    de: 'Short German description',
    en: 'Short English description',
  },
  longDescription: {
    de: 'Long German description...',
    en: 'Long English description...',
  },
  images: [
    { src: '/images/folder/image1.jpg', alt: 'Image description' },
    { src: '/images/folder/image2.jpg', alt: 'Image description' },
    // ... more images
  ],
  facts: {
    guests: 6,
    bedrooms: 2,
    beds: 3,
    bathrooms: 2,
    sqm: 120, // optional
  },
  location: {
    lat: 46.6244,  // Latitude
    lng: 8.0344,   // Longitude
    label: 'Grindelwald', // optional
  },
  bookingLinks: [
    { label: 'Airbnb', url: 'https://airbnb.com/...' },
    { label: 'e-domizil', url: 'https://e-domizil.ch/...' },
    { label: 'Direct Booking', url: 'mailto:info@stieregg.ch' },
  ],
  icalUrls: [
    'https://calendar.example.com/feed.ics',
    // Add multiple iCal URLs if needed
  ],
}
```

### 2. Add Images

1. Create a folder in `public/images/` with a descriptive name (e.g., `apartment-name/`)
2. Add your apartment images to this folder
3. Reference them in the `images` array using the path `/images/folder-name/filename.jpg`

**Image Guidelines:**
- Use descriptive filenames
- Recommended format: JPG or WebP
- Recommended size: 768px width or larger
- Images will be automatically optimized by Next.js Image component

### 3. Add iCal URLs

To display availability calendars:

1. Get the iCal feed URL from your booking platform (Airbnb, Booking.com, etc.)
2. Add the URL(s) to the `icalUrls` array in the apartment data
3. The calendar will automatically fetch and display booked dates

**Note:** iCal feeds are cached for 30 minutes to improve performance.

### 4. Set Location Coordinates

For the map view:

1. Find the latitude and longitude of your apartment (use Google Maps or similar)
2. Add them to the `location` object:
   ```typescript
   location: {
     lat: 46.6244,  // Replace with actual latitude
     lng: 8.0344,   // Replace with actual longitude
   }
   ```

## Features

### Pages

- **Home (`/`)**: Hero section, apartment grid/map toggle
- **Apartment Detail (`/apartments/[slug]`)**: Full apartment information, gallery, calendar
- **About (`/about`)**: About us page (DE/EN)
- **Impressum (`/impressum`)**: Legal notice (DE/EN)
- **Privacy (`/privacy`)**: Privacy policy (DE/EN)

### Components

- **ApartmentCard**: Grid view card with image carousel and calendar preview
- **ApartmentMiniCard**: Compact card for map popups
- **MapView**: Interactive Leaflet map with apartment pins
- **AvailabilityCalendar**: Lightweight calendar showing booked dates
- **ImageCarousel**: Image slider with navigation

### Localization

The site supports German (DE) and English (EN) via URL query parameter:
- `?lang=de` for German
- `?lang=en` for English

Default language is German.

## API Routes

### `/api/availability?slug=apartment-slug`

Returns availability data for an apartment:

```json
{
  "slug": "apartment-slug",
  "bookedRanges": [
    { "start": "2024-01-15", "end": "2024-01-20" },
    { "start": "2024-02-10", "end": "2024-02-15" }
  ]
}
```

## Styling

The site uses a custom Tailwind configuration with:
- **Accent color**: Gold (`#D4AF37`) for CTAs and highlights
- **Design system**: Button, Card, Badge, SectionTitle components
- **Responsive**: Mobile-first approach
- **Animations**: Smooth transitions and hover effects

## Building for Production

```bash
npm run build
npm start
```

## Environment Variables

Currently, no environment variables are required. If you need to add API keys or other secrets, create a `.env.local` file:

```env
# Example
NEXT_PUBLIC_API_URL=https://api.example.com
```

## Troubleshooting

### Map not showing

- Ensure Leaflet CSS is imported (already in `globals.css`)
- Check browser console for errors
- Verify apartment coordinates are valid

### Calendar not loading

- Check iCal URLs are accessible
- Verify network requests in browser DevTools
- Check server logs for parsing errors

### Images not displaying

- Verify image paths in `apartments.ts` match actual file locations
- Ensure images are in `public/images/` directory
- Check file permissions

## License

Private project - All rights reserved.

## Contact

For questions or support, contact: info@stieregg.ch

