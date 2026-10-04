import { PINCODE_LOOKUP_URL } from "../constants/externalApis";
import { INDIAN_STATES } from "../constants/indianStates";

// Same rule as the backend Joi schema
export const PINCODE_PATTERN = /^[1-9][0-9]{5}$/;

// Lower case, "&" → "and", no punctuation: "Jammu & Kashmir" and "Jammu and Kashmir" compare equal
const simplify = (name = "") =>
  name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Names India Post / Mapbox use that differ from our INDIAN_STATES list
const ALIASES = {
  "nct of delhi": "Delhi",
  "national capital territory of delhi": "Delhi",
  "dadra and nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "daman and diu": "Dadra and Nagar Haveli and Daman and Diu",
  pondicherry: "Puducherry",
  orissa: "Odisha",
  uttaranchal: "Uttarakhand",
  "andaman and nicobar": "Andaman and Nicobar Islands",
};

// Our state name for whatever an API returned, or "" if it isn't one of INDIAN_STATES
export const toKnownState = (name) => {
  const simple = simplify(name);
  if (!simple) return "";
  return ALIASES[simple] || INDIAN_STATES.find((state) => simplify(state) === simple) || "";
};

export const sameState = (a, b) => {
  const known = toKnownState(a);
  return Boolean(known) && known === toKnownState(b);
};

/**
 * { city, district, state } for a pincode, or null if India Post doesn't know it.
 * Throws when the service is unreachable (callers treat that as "can't check", not as invalid).
 */
export const lookupPincode = async (pincode) => {
  const response = await fetch(`${PINCODE_LOOKUP_URL}/${pincode}`);
  if (!response.ok) throw new Error("Pincode lookup unavailable");

  const [result] = await response.json();
  if (result?.Status !== "Success" || !result.PostOffice?.length) return null;

  // Prefer a delivery office; Block is often "NA", so the district stands in for the city
  const office = result.PostOffice.find((po) => po.DeliveryStatus === "Delivery") || result.PostOffice[0];
  const district = office.District?.trim() || "";
  return { city: district, district, state: toKnownState(office.State) || office.State?.trim() || "" };
};
