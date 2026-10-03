import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { usePrefetchProductFilters, usePrefetchProducts } from "../Products/ProductHooks";
import { DEFAULT_SORT, SHOP_PAGE_SIZE, SHOP_SORT_OPTIONS } from "../../constants/shopOptions";

const SORT_VALUES = SHOP_SORT_OPTIONS.map((option) => option.value);
const SIZE_PATTERN = /^[A-Z0-9/ ]{1,20}$/;
const CATEGORY_PATTERN = /^[a-z_]{1,50}$/;

// Everything "Clear all" resets (sort is kept)
const FILTER_KEYS = ["search", "category", "combo", "sizes", "minPrice", "maxPrice", "inStock"];

const toPrice = (value) => (/^\d{1,7}$/.test(value || "") ? value : "");

// URL → normalized filters; malformed values are ignored instead of being sent to the API
const readFilters = (searchParams) => {
  const minPrice = toPrice(searchParams.get("minPrice"));
  const rawMax = toPrice(searchParams.get("maxPrice"));
  const maxPrice = minPrice && rawMax && Number(minPrice) > Number(rawMax) ? "" : rawMax;
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort");
  const sizes = (searchParams.get("sizes") || "")
    .split(",")
    .map((size) => size.trim().toUpperCase())
    .filter((size) => SIZE_PATTERN.test(size));

  return {
    search: (searchParams.get("search") || "").trim().slice(0, 100),
    category: CATEGORY_PATTERN.test(category) ? category : "",
    combo: searchParams.get("combo") === "true",
    sizes: [...new Set(sizes)],
    minPrice,
    maxPrice,
    inStock: searchParams.get("inStock") === "true",
    sort: SORT_VALUES.includes(sort) ? sort : DEFAULT_SORT,
    page: Math.max(1, parseInt(searchParams.get("page"), 10) || 1),
  };
};

// Filters → params for GET /user/products (empty values are dropped by the products hooks)
const toApiParams = (filters) => ({
  search: filters.search,
  category: filters.category,
  combo: filters.combo || undefined,
  sizes: filters.sizes.join(","),
  minPrice: filters.minPrice,
  maxPrice: filters.maxPrice,
  inStock: filters.inStock || undefined,
  sort: filters.sort,
  page: filters.page,
  limit: SHOP_PAGE_SIZE,
});

// Filter value → query-string value; empty and default values are left out of the URL
const serialize = (key, value) => {
  if (Array.isArray(value)) return value.join(",");
  if (typeof value === "boolean") return value ? "true" : "";
  if (key === "sort" && value === DEFAULT_SORT) return "";
  if (key === "page" && Number(value) <= 1) return "";
  return value === undefined || value === null ? "" : String(value);
};

/**
 * Shop filters, sort, search and page live in the query string, so refresh, back and sharing keep them:
 * /shop?search=xl&sizes=XL,XXL&minPrice=100&maxPrice=500&combo=true&sort=price_asc&page=2
 * Any update that isn't a page change goes back to page 1.
 */
export const useShopParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);

  const updateFilters = useCallback(
    (updates, { replace = false } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(updates).forEach(([key, value]) => {
            const serialized = serialize(key, value);
            if (serialized) next.set(key, serialized);
            else next.delete(key);
          });
          if (!("page" in updates)) next.delete("page");
          return next;
        },
        { replace }
      );
    },
    [setSearchParams]
  );

  const clearFilters = useCallback(
    () => updateFilters(Object.fromEntries(FILTER_KEYS.map((key) => [key, ""]))),
    [updateFilters]
  );

  const apiParams = useMemo(() => toApiParams(filters), [filters]);

  return { filters, apiParams, updateFilters, clearFilters };
};

// Warms the first shop page (same query keys the Shop page uses) and the filter options, so opening
// /shop shows products straight away. `search` is the shop URL's query string ("" for the default view).
export const usePrefetchShop = () => {
  const prefetchProducts = usePrefetchProducts();
  const prefetchFilters = usePrefetchProductFilters();

  return useCallback(
    (search = "") => {
      prefetchProducts(toApiParams(readFilters(new URLSearchParams(search))));
      prefetchFilters();
    },
    [prefetchProducts, prefetchFilters]
  );
};
