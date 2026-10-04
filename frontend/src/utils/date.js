const DATE = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const MONTH_YEAR = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" });

// "28 Sept 2026"
export const formatDate = (value) => (value ? DATE.format(new Date(value)) : "");

// "October 2026" (member since)
export const formatMonthYear = (value) => (value ? MONTH_YEAR.format(new Date(value)) : "");
