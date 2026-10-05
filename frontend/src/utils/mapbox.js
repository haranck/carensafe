import { MAPBOX_REVERSE_GEOCODE_URL } from "../constants/externalApis";

// Public (pk.) token; without it the map and "Use my current location" are hidden
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";
export const hasMapboxToken = Boolean(MAPBOX_TOKEN);

// IMPORTANT: coordinates are always [longitude, latitude] (GeoJSON / Mapbox / our API order).
// The browser's geolocation gives latitude and longitude separately, so convert once with toLngLat().
export const toLngLat = (position) => [position.coords.longitude, position.coords.latitude];

// Whole of India until the user is located
export const INDIA_CENTER = [78.9629, 20.5937];
export const INDIA_ZOOM = 4;
export const LOCATED_ZOOM = 16;

/**
 * Address fields for a point: { line2, city, district, state, pincode, formattedAddress }. Missing parts are "".
 * Throws if Mapbox can't be reached or finds nothing.
 */
export const reverseGeocode = async (lng, lat) => {
  const params = new URLSearchParams({
    longitude: String(lng),
    latitude: String(lat),
    country: "in",
    language: "en",
    limit: "1",
    access_token: MAPBOX_TOKEN,
  });
  const response = await fetch(`${MAPBOX_REVERSE_GEOCODE_URL}?${params}`);
  if (!response.ok) throw new Error("Couldn't look up this location.");

  const feature = (await response.json()).features?.[0];
  if (!feature) throw new Error("No address found for this spot. Enter it manually.");

  const { context = {}, full_address: fullAddress, place_formatted: placeFormatted } = feature.properties || {};
  // Area / street: the street (with number if Mapbox knows it), then neighbourhood and locality
  const street = context.address?.name || context.street?.name;
  const line2 = [street, context.neighborhood?.name, context.locality?.name]
    .filter(Boolean)
    .filter((part, index, parts) => parts.indexOf(part) === index)
    .join(", ");

  return {
    line2,
    city: context.place?.name || context.locality?.name || "",
    district: context.district?.name || "",
    state: context.region?.name || "",
    pincode: context.postcode?.name || "",
    formattedAddress: fullAddress || placeFormatted || "",
  };
};
