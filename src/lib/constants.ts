/** Company contact – use everywhere across the site */

export const COMPANY = {
  name: "HapyJo Ltd",
  tagline: "Site & Fleet Control",
  phone: "+250788944143",
  email: "mugwanezajeanbosco5@gmail.com",
  address: {
    country: "Rwanda",
    province: "Eastern Province",
    district: "Bugesera District",
    sector: "Ruhuha Sector",
    location: "Siblings Motel",
  },
} as const;

/** Map / Our Location – SIBLINGS BUUM HOTEL (embed & directions) */
export const MAP_LOCATION = {
  name: "SIBLINGS BUUM HOTEL",
  latitude: -2.3092956,
  longitude: 30.0057884,
  zoom: 15,
  /** Full address for display */
  address: "Bugesera District, Eastern Province, Rwanda",
  /** Open in Google Maps (new tab) */
  googleMapsUrl: "https://www.google.com/maps/place/SIBLINGS+BUUM+HOTEL/@-2.3092902,30.0032135,697m/data=!3m2!1e3!4b1!4m6!3m5!1s0x19c35b0018c301c3:0x2ddad51761868ee!8m2!3d-2.3092956!4d30.0057884!16s%2Fg%2F11vpfcfw_t",
  /** Embed-friendly URL (no API key): center + zoom */
  embedUrl: "https://maps.google.com/maps?q=-2.3092956,30.0057884&z=15&output=embed",
} as const;

export const FLEET_STATS = {
  machines: 11,
  trucks: 23,
  totalFleet: 34,
  imagesUsed: 94,
} as const;
