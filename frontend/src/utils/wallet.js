// Wallet amounts arrive in PAISE (integers); rupees only for display
const RUPEES = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 2 });

// 45000 → "₹450", 12345 → "₹123.45"
export const formatPaise = (paise) => RUPEES.format((paise || 0) / 100);
