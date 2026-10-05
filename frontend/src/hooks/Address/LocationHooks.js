import { useMutation, useQuery } from "@tanstack/react-query";
import { reverseGeocode } from "../../utils/mapbox";
import { lookupPincode, PINCODE_PATTERN } from "../../utils/pincode";

// Pincodes don't move: one lookup per pincode per session. Only runs for a valid 6-digit pincode.
// data: { city, district, state } | null (not found). An error means the service is down → callers fail open.
export const usePincodeLookup = (pincode) =>
    useQuery({
        queryKey: ["pincode", pincode],
        queryFn: () => lookupPincode(pincode),
        enabled: PINCODE_PATTERN.test(pincode || ""),
        staleTime: Infinity,
        gcTime: Infinity,
        retry: 1,
    });

// [lng, lat] → address fields (see utils/mapbox.js)
export const useReverseGeocode = () =>
    useMutation({
        mutationFn: ([lng, lat]) => reverseGeocode(lng, lat),
    });
