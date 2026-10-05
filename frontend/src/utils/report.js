import { formatPrice } from "./product";

// Same values as backend utils/report.js REPORT_PERIODS
export const PERIOD_OPTIONS = [
  { value: "daily", label: "Daily", hint: "Today, by hour" },
  { value: "weekly", label: "Weekly", hint: "Last 7 days" },
  { value: "monthly", label: "Monthly", hint: "Last 30 days" },
  { value: "yearly", label: "Yearly", hint: "Last 12 months" },
  { value: "custom", label: "Custom", hint: "Pick dates" },
];

export const periodHint = (period) => PERIOD_OPTIONS.find((option) => option.value === period)?.hint || "";

// Chart colours (validated as a set: indigo, orange, aqua). Net revenue is always indigo, returns always orange.
export const CHART_COLORS = { net: "#4f46e5", returned: "#eb6834", orders: "#4f46e5", grid: "#e2e8f0", axis: "#64748b" };
export const PAYMENT_COLORS = { cod: "#4f46e5", razorpay: "#eb6834", wallet: "#1baf7a" };
// Legend / tooltip swatches per chart colour (full class strings so Tailwind generates them)
const SWATCH_CLASSES = { "#4f46e5": "bg-[#4f46e5]", "#eb6834": "bg-[#eb6834]", "#1baf7a": "bg-[#1baf7a]" };
export const swatchClass = (color) => SWATCH_CLASSES[color] || "bg-slate-400";
export const PAYMENT_SHORT_LABELS = { cod: "Cash on Delivery", razorpay: "Online", wallet: "Wallet" };

// Bucket keys come from the API in India time: "2026-10-05T14" (hour), "2026-10-05" (day), "2026-10" (month)
const keyToDate = (key) => {
  const [datePart, hour = "0"] = key.split("T");
  const [year, month, day = "1"] = datePart.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, Number(day), Number(hour)));
};

const formatter = (options) => new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", ...options });
const HOUR = formatter({ hour: "numeric", hour12: true });
const DAY = formatter({ day: "numeric", month: "short" });
const DAY_LONG = formatter({ weekday: "short", day: "numeric", month: "short", year: "numeric" });
const MONTH = formatter({ month: "short", year: "2-digit" });
const MONTH_LONG = formatter({ month: "long", year: "numeric" });

const unitOf = (key) => (key.includes("T") ? "hour" : key.length === 7 ? "month" : "day");

// Axis tick: "2 pm", "5 Oct", "Oct 26"
export const bucketLabel = (key) => {
  const date = keyToDate(key);
  const unit = unitOf(key);
  if (unit === "hour") return HOUR.format(date);
  if (unit === "month") return MONTH.format(date);
  return DAY.format(date);
};

// Tooltip title: "2 pm – 3 pm, 5 Oct", "Sun, 5 Oct 2026", "October 2026"
export const bucketTitle = (key) => {
  const date = keyToDate(key);
  const unit = unitOf(key);
  if (unit === "hour") {
    const next = new Date(date.getTime() + 60 * 60 * 1000);
    return `${HOUR.format(date)} – ${HOUR.format(next)}, ${DAY.format(date)}`;
  }
  if (unit === "month") return MONTH_LONG.format(date);
  return DAY_LONG.format(date);
};

// Report window in India time: "6 Sep 2026 – 5 Oct 2026"
const RANGE_DAY = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
export const formatRange = (range) => (range ? `${RANGE_DAY.format(new Date(range.from))} – ${RANGE_DAY.format(new Date(range.to))}` : "");

// Axis money: ₹950, ₹1.2K, ₹3.4L
const COMPACT = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
export const formatCompactPrice = (value) => (Math.abs(value) < 1000 ? formatPrice(Math.round(value)) : `₹${COMPACT.format(value)}`);

// Two-decimal rupees for reports (₹1,234.50)
const MONEY = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const formatMoney = (value) => `₹${MONEY.format(value || 0)}`;

// "+12.5%" / "−4%" / null when there is nothing to compare with
export const formatChange = (change) => {
  if (change === null || change === undefined) return null;
  const rounded = Math.round(change * 10) / 10;
  return `${rounded > 0 ? "+" : rounded < 0 ? "−" : ""}${Math.abs(rounded)}%`;
};

// YYYY-MM-DD of today (local), for date input limits
export const todayInputValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
