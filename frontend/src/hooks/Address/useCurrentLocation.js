import { useCallback, useState } from "react";
import { toLngLat } from "../../utils/mapbox";

const OPTIONS = { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 };

const MESSAGES = {
  unsupported: "Your browser can't share your location. Enter the address manually.",
  insecure: "Location only works on a secure (https) page. Enter the address manually.",
  1: "Location access is blocked. Allow it in your browser settings or enter the address manually.",
  2: "We couldn't find your location. Check that location services are on, or enter the address manually.",
  3: "Finding your location took too long. Try again, or enter the address manually.",
};

/**
 * The device's position. Works only on HTTPS or localhost.
 * coords: [lng, lat] (GeoJSON order), accuracy in metres, status: "idle" | "locating" | "success" | "error".
 * locate() resolves with { coords, accuracy } or null (the error is in `error`).
 */
export const useCurrentLocation = () => {
  const [state, setState] = useState({ coords: null, accuracy: null, status: "idle", error: "" });

  const locate = useCallback(
    () =>
      new Promise((resolve) => {
        const fail = (error) => {
          setState((s) => ({ ...s, status: "error", error }));
          resolve(null);
        };
        if (!window.isSecureContext) return fail(MESSAGES.insecure);
        if (!("geolocation" in navigator)) return fail(MESSAGES.unsupported);

        setState((s) => ({ ...s, status: "locating", error: "" }));
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const result = { coords: toLngLat(position), accuracy: Math.round(position.coords.accuracy) };
            setState({ ...result, status: "success", error: "" });
            resolve(result);
          },
          (error) => fail(MESSAGES[error.code] || MESSAGES[2]),
          OPTIONS
        );
        return undefined;
      }),
    []
  );

  return { ...state, locate };
};
