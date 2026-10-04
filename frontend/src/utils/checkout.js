/**
 * The checkout's money rows, all in one place. Subtotal and shipping come from the cart API (GET /user/cart summary);
 * discount is 0 until coupons exist. The server recomputes all of it when the order is placed.
 */
export const checkoutTotals = (summary) => {
  const subtotal = summary?.subtotal || 0;
  const discount = 0;
  const shipping = summary?.shipping || 0;
  return { itemCount: summary?.itemCount || 0, subtotal, discount, shipping, total: Math.max(0, subtotal - discount + shipping) };
};

// Payment options at checkout (ids match the API's paymentMethod)
export const PAYMENT_METHODS = [
  { id: "razorpay", label: "Pay Online", hint: "UPI · Cards · Net Banking · Wallets" },
  { id: "wallet", label: "Care N Safe Wallet", hint: "Pay with your wallet balance" },
  { id: "cod", label: "Cash on Delivery", hint: "Pay in cash or UPI when your order arrives" },
];

// Razorpay's smallest payment (₹1), same rule as the API
const MIN_ONLINE_PAISE = 100;

/**
 * What the customer pays where (paise), mirroring the API: wallet first when "use wallet" is on, the rest online;
 * a wallet that covers everything turns it into a wallet payment. Shown in the summary; the server decides for real.
 */
export const paymentSplit = ({ totalRupees, method, useWallet, balancePaise }) => {
  const totalPaise = Math.round(totalRupees * 100);
  if (method === "wallet") return { method, walletPaise: totalPaise, onlinePaise: 0 };
  if (method !== "razorpay") return { method, walletPaise: 0, onlinePaise: 0 };
  if (!useWallet || balancePaise <= 0) return { method, walletPaise: 0, onlinePaise: totalPaise };
  let walletPaise = Math.min(balancePaise, totalPaise);
  if (walletPaise === totalPaise) return { method: "wallet", walletPaise, onlinePaise: 0 };
  if (totalPaise - walletPaise < MIN_ONLINE_PAISE) walletPaise = Math.max(0, totalPaise - MIN_ONLINE_PAISE);
  return { method, walletPaise, onlinePaise: totalPaise - walletPaise };
};

// A new id per checkout attempt (the API returns the same order for the same id)
export const newCheckoutKey = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
