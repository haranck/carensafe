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

// Cash on Delivery only for now; "online" becomes Razorpay (UPI, cards, net banking) later
export const PAYMENT_METHODS = [
  { id: "cod", label: "Cash on Delivery", hint: "Pay in cash or UPI when your order arrives", isAvailable: true },
  { id: "online", label: "Pay Online", hint: "UPI, cards and net banking", isAvailable: false },
];
