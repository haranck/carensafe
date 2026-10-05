import { useCallback } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
    getProducts,
    getProductById,
    getProductFilters,
    getSimilarProducts,
} from "../../services/Products/productService";

const STALE_TIME = 5 * 60 * 1000;
const FILTERS_STALE_TIME = 30 * 60 * 1000;
const SIMILAR_LIMIT = 8;

// Drop empty values: the API rejects e.g. `category=""`
const cleanParams = (params) =>
    Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""));

// Invalid id (400) and missing product (404) won't change on retry
const retryUnlessNotFound = (failureCount, error) =>
    ![400, 404].includes(error?.response?.status) && failureCount < 2;

const productsQuery = (params) => {
    const query = cleanParams(params);
    return { queryKey: ["products", query], queryFn: () => getProducts(query), staleTime: STALE_TIME };
};

// params: { page, limit, search, category, combo, sizes, minPrice, maxPrice, inStock, sort }
export const useGetProducts = (params = {}) => {
    return useQuery({ ...productsQuery(params), placeholderData: keepPreviousData });
};

// Warms another page of the list (e.g. the next shop page) so paging feels instant
export const usePrefetchProducts = () => {
    const queryClient = useQueryClient();
    return useCallback((params) => queryClient.prefetchQuery(productsQuery(params)), [queryClient]);
};

const productFiltersQuery = { queryKey: ["product_filters"], queryFn: getProductFilters, staleTime: FILTERS_STALE_TIME };

// { categories: [{ value, label, count }], sizes, priceRange: { min, max }, comboCount }
export const useGetProductFilters = () => {
    return useQuery(productFiltersQuery);
};

export const usePrefetchProductFilters = () => {
    const queryClient = useQueryClient();
    return useCallback(() => queryClient.prefetchQuery(productFiltersQuery), [queryClient]);
};

export const useGetProductById = (id) => {
    return useQuery({
        queryKey: ["product", id],
        queryFn: () => getProductById(id),
        enabled: Boolean(id),
        staleTime: STALE_TIME,
        retry: retryUnlessNotFound,
    });
};

// Warms ["product", id] (e.g. on card hover) so the detail page can render without waiting for the API
export const usePrefetchProduct = () => {
    const queryClient = useQueryClient();
    return (id) =>
        queryClient.prefetchQuery({
            queryKey: ["product", id],
            queryFn: () => getProductById(id),
            staleTime: STALE_TIME,
        });
};

export const useGetSimilarProducts = (id, limit = SIMILAR_LIMIT) => {
    return useQuery({
        queryKey: ["similar_products", id, limit],
        queryFn: () => getSimilarProducts(id, limit),
        enabled: Boolean(id),
        staleTime: STALE_TIME,
        retry: retryUnlessNotFound,
    });
};
