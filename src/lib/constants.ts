/** Company contact – use everywhere across the site */

export const COMPANY = {
  name: "HapyJo Ltd",
  tagline: "Site & Fleet Control",
  phone: "+91 6304066684",
  email: "privacy@hapyjoltd.com",
  address: {
    country: "Rwanda",
    province: "Eastern Province",
    district: "Bugesera District",
    sector: "Ruhuha Sector",
    location: "Hapyjo Ltd, Ruhuha",
  },
} as const;

/** Map / Our Location – Hapyjo Ltd, Ruhuha (embed & directions) */
export const MAP_LOCATION = {
  name: "Hapyjo Ltd",
  latitude: -2.3092956,
  longitude: 30.0057884,
  zoom: 15,
  /** Full address for display */
  address: "Ruhuha, Rwanda",
  /** Open in Google Maps (new tab) */
  googleMapsUrl: "https://maps.app.goo.gl/dt7Nqg7PRsJmmRK56",
  /** Embed-friendly URL (no API key): center + zoom */
  embedUrl: "https://maps.google.com/maps?q=Hapyjo%20Ltd%2C%20Ruhuha%2C%20Rwanda&z=15&output=embed",
} as const;

export const FLEET_STATS = {
  machines: 11,
  trucks: 23,
  totalFleet: 34,
  imagesUsed: 94,
} as const;
