import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getProducts, getProductById } from "../../services/Products/productService";

const STALE_TIME = 5 * 60 * 1000;

// Drop empty values: the API rejects e.g. `category=""`
const cleanParams = (params) =>
    Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""));

// params: { page, limit, search, category, sort }
export const useGetProducts = (params = {}) => {
    const query = cleanParams(params);
    return useQuery({
        queryKey: ["products", query],
        queryFn: () => getProducts(query),
        placeholderData: keepPreviousData,
        staleTime: STALE_TIME,
    });
};

export const useGetProductById = (id) => {
    return useQuery({
        queryKey: ["product", id],
        queryFn: () => getProductById(id),
        enabled: Boolean(id),
        staleTime: STALE_TIME,
    });
};
