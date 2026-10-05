import { useEffect } from "react";

export const SITE_NAME = "CareNsafe";

// "CareNsafe | Shop"; no name → just "CareNsafe" (same as index.html, shown while the app loads)
export const pageTitle = (name) => (name ? `${SITE_NAME} | ${name}` : SITE_NAME);

/**
 * Sets the browser tab title for the current page. Every page calls it once at the top (`usePageTitle("Shop")`),
 * so nothing needs restoring on leave: the next page sets its own. Pass a changing name (e.g. a product name once
 * it has loaded) and the title follows.
 */
export const usePageTitle = (name) => {
  useEffect(() => {
    document.title = pageTitle(name);
  }, [name]);
};

export default usePageTitle;
