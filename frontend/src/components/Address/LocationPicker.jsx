import { useCallback, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { INDIA_CENTER, INDIA_ZOOM, LOCATED_ZOOM, MAPBOX_TOKEN, toLngLat } from "../../utils/mapbox";

const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";
const PIN_COLOR = "#d6008a";

/**
 * Map with a draggable pink pin. Lazy-loaded (mapbox-gl stays out of the main bundle).
 * All coordinates are [lng, lat].
 * - initialCoords: pin shown on mount (editing a saved address)
 * - target: { coords } — a new object flies there and moves the pin ("Use my current location")
 * - onPick(coords, accuracy?): the pin was dragged, the map clicked, or the map's own locate button used
 * - onError(): the map couldn't start (bad token, no WebGL); the parent hides it
 */
const LocationPicker = ({ initialCoords, target, onPick, onError }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const initialCoordsRef = useRef(initialCoords);
  // Latest callbacks, without re-creating the map when the parent re-renders
  const callbacksRef = useRef({ onPick, onError });
  useEffect(() => {
    callbacksRef.current = { onPick, onError };
  });

  const placeMarker = useCallback((coords) => {
    const map = mapRef.current;
    if (!map) return;
    if (markerRef.current) {
      markerRef.current.setLngLat(coords);
      return;
    }
    const marker = new mapboxgl.Marker({ color: PIN_COLOR, draggable: true }).setLngLat(coords).addTo(map);
    marker.on("dragend", () => {
      const { lng, lat } = marker.getLngLat();
      callbacksRef.current.onPick([lng, lat]);
    });
    markerRef.current = marker;
  }, []);

  useEffect(() => {
    const initial = initialCoordsRef.current;
    let map;
    try {
      map = new mapboxgl.Map({
        container: containerRef.current,
        accessToken: MAPBOX_TOKEN,
        style: MAP_STYLE,
        center: initial || INDIA_CENTER,
        zoom: initial ? LOCATED_ZOOM : INDIA_ZOOM,
        // Inside a scrolling modal: two fingers / Ctrl + scroll move the map, one finger scrolls the page
        cooperativeGestures: true,
      });
    } catch {
      // No WebGL etc.
      callbacksRef.current.onError();
      return undefined;
    }
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      trackUserLocation: false,
      showUserLocation: false,
    });
    map.addControl(geolocate, "top-right");
    geolocate.on("geolocate", (position) => {
      const coords = toLngLat(position);
      placeMarker(coords);
      callbacksRef.current.onPick(coords, Math.round(position.coords.accuracy), "locate");
    });

    map.on("click", (event) => {
      const coords = [event.lngLat.lng, event.lngLat.lat];
      placeMarker(coords);
      callbacksRef.current.onPick(coords);
    });

    // Failing before the first load means the map can't work (invalid token, blocked style); later tile errors are ignored
    let loaded = false;
    map.on("load", () => {
      loaded = true;
      map.resize();
    });
    map.on("error", () => {
      if (!loaded) callbacksRef.current.onError();
    });

    if (initial) placeMarker(initial);

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [placeMarker]);

  useEffect(() => {
    if (!target || !mapRef.current) return;
    placeMarker(target.coords);
    mapRef.current.flyTo({ center: target.coords, zoom: LOCATED_ZOOM, essential: true });
  }, [target, placeMarker]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Map. Drag the pin or click the map to set the delivery location."
      className="h-60 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
    />
  );
};

export default LocationPicker;
