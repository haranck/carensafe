import { Component, Suspense, lazy, useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, LocateFixed } from "lucide-react";
import { useCurrentLocation } from "../../hooks/Address/useCurrentLocation";
import { useReverseGeocode } from "../../hooks/Address/LocationHooks";
import { hasMapboxToken } from "../../utils/mapbox";
import { FOCUS_RING } from "../../constants/customerTheme";

// mapbox-gl (+ its CSS) downloads only when an address form opens
const LocationPicker = lazy(() => import("./LocationPicker"));

const GEOCODE_DELAY = 500;
const APPROXIMATE_METRES = 100;

// The map's code failed to download / crashed: drop the map, keep the form
class MapBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * "Use my current location" + map pin at the top of the address form. Hidden without a Mapbox token.
 * Coordinates are [lng, lat].
 * - initialCoords / initialFormattedAddress: the saved pin when editing
 * - onCoordsChange(coords): the pin moved (sent with the address)
 * - onAddressFound(fields, source): reverse-geocoded fields; source "locate" (device location) or "pin" (drag / click)
 */
const LocationSection = ({ initialCoords, initialFormattedAddress, onCoordsChange, onAddressFound }) => {
  const { locate, status, error: locateError } = useCurrentLocation();
  const { mutateAsync: geocode, isPending: isGeocoding } = useReverseGeocode();
  const [target, setTarget] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [formattedAddress, setFormattedAddress] = useState(initialFormattedAddress || "");
  const [geocodeError, setGeocodeError] = useState("");
  const [mapFailed, setMapFailed] = useState(false);
  const timerRef = useRef(null);
  const requestRef = useRef(0);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Only the newest lookup may fill the form (drags can overtake each other)
  const findAddress = (coords, source) => {
    const request = ++requestRef.current;
    setGeocodeError("");
    geocode(coords)
      .then((fields) => {
        if (request !== requestRef.current) return;
        setFormattedAddress(fields.formattedAddress);
        onAddressFound(fields, source);
      })
      .catch((error) => {
        if (request === requestRef.current) setGeocodeError(error.message || "Couldn't look up this location.");
      });
  };

  const handleLocate = async () => {
    const result = await locate();
    if (!result) return;
    clearTimeout(timerRef.current);
    setTarget({ coords: result.coords });
    setAccuracy(result.accuracy);
    onCoordsChange(result.coords);
    findAddress(result.coords, "locate");
  };

  // Drag / click: debounced. The map's own locate button passes an accuracy and source "locate".
  const handlePick = (coords, pickAccuracy = null, source = "pin") => {
    setAccuracy(pickAccuracy);
    onCoordsChange(coords);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => findAddress(coords, source), GEOCODE_DELAY);
  };

  if (!hasMapboxToken) return null;

  const isLocating = status === "locating";
  const message = locateError || geocodeError;

  return (
    <section aria-label="Delivery location" className="flex flex-col gap-3 rounded-2xl border border-pink-100 bg-[#fff5fa]/60 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] font-bold uppercase tracking-wide text-slate-500">Delivery location</p>
        <button
          type="button"
          onClick={handleLocate}
          disabled={isLocating}
          className={`inline-flex h-10 items-center gap-2 rounded-full border border-[#d6008a] bg-white px-4 text-[13px] font-bold text-[#d6008a] hover:bg-[#fff5fa] hover:text-[#9d0063] disabled:cursor-wait disabled:opacity-70 transition-colors ${FOCUS_RING}`}
        >
          {isLocating ? <Loader2 size={16} aria-hidden="true" className="animate-spin" /> : <LocateFixed size={16} aria-hidden="true" />}
          {isLocating ? "Finding you…" : "Use my current location"}
        </button>
      </div>

      {!mapFailed && (
        <MapBoundary onError={() => setMapFailed(true)}>
          <Suspense fallback={<div aria-hidden="true" className="h-60 w-full animate-pulse rounded-2xl bg-slate-100" />}>
            <LocationPicker initialCoords={initialCoords} target={target} onPick={handlePick} onError={() => setMapFailed(true)} />
          </Suspense>
        </MapBoundary>
      )}

      <div aria-live="polite" className="flex flex-col gap-1.5 empty:hidden">
        {isGeocoding && (
          <p className="flex items-center gap-1.5 text-[12.5px] text-slate-500">
            <Loader2 size={13} aria-hidden="true" className="animate-spin" />
            Finding the address…
          </p>
        )}
        {!isGeocoding && formattedAddress && (
          <p className="text-[12.5px] leading-relaxed text-slate-600">
            <span aria-hidden="true">📍 </span>
            {formattedAddress}
          </p>
        )}
        {accuracy > APPROXIMATE_METRES && (
          <p className="text-[12px] font-semibold text-amber-700">Location may be approximate — drag the pin to adjust.</p>
        )}
        {message && (
          <p role="alert" className="flex items-start gap-1.5 text-[12.5px] font-semibold text-rose-600">
            <AlertCircle size={14} aria-hidden="true" className="mt-0.5 flex-shrink-0" />
            {message}
          </p>
        )}
      </div>
    </section>
  );
};

export default LocationSection;
