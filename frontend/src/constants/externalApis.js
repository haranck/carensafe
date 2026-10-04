// Third-party APIs called straight from the browser (our own API lives in apiRoutes.js)

// Mapbox Geocoding v6 reverse lookup: ?longitude=&latitude=&access_token=
export const MAPBOX_REVERSE_GEOCODE_URL = "https://api.mapbox.com/search/geocode/v6/reverse";

// India Post pincode lookup (no key, CORS open): `${PINCODE_LOOKUP_URL}/600001`
export const PINCODE_LOOKUP_URL = "https://api.postalpincode.in/pincode";
