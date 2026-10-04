import { z } from "zod";

/**
 * The checkout's money rows, all in one place. Subtotal and shipping come from the cart API (GET /user/cart summary);
 * discount is 0 until coupons exist. Replace `discount` / `shipping` here when real values arrive.
 */
export const checkoutTotals = (summary) => {
  const subtotal = summary?.subtotal || 0;
  const discount = 0;
  const shipping = summary?.shipping || 0;
  return { itemCount: summary?.itemCount || 0, subtotal, discount, shipping, total: Math.max(0, subtotal - discount + shipping) };
};

// "CNS-DEMO-482913": shown on the demo success page only (no order exists)
export const demoOrderNumber = () => `CNS-DEMO-${Math.floor(100000 + Math.random() * 900000)}`;

// ── Payment (DEMO: nothing below is ever sent, logged or stored) ──────────────

export const PAYMENT_METHODS = [
  { id: "upi", label: "UPI", hint: "Google Pay, PhonePe, Paytm or any UPI app" },
  { id: "card", label: "Credit / Debit Card", hint: "Visa, Mastercard, RuPay" },
  { id: "netbanking", label: "Net Banking", hint: "All major Indian banks" },
  { id: "cod", label: "Cash on Delivery", hint: "Pay when your order arrives" },
];

export const UPI_APPS = ["GPay", "PhonePe", "Paytm"];

export const BANKS = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank of India",
  "IndusInd Bank",
  "Yes Bank",
  "IDFC FIRST Bank",
];

export const paymentLabel = (methodId) => PAYMENT_METHODS.find((method) => method.id === methodId)?.label || "";

const digits = (value = "") => value.replace(/\D/g, "");

// "4242424242424242" → "4242 4242 4242 4242"
export const formatCardNumber = (value) =>
  digits(value)
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");

// "1228" → "12/28"
export const formatExpiry = (value) => {
  const raw = digits(value).slice(0, 4);
  return raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw;
};

export const formatCvv = (value) => digits(value).slice(0, 4);

// Standard card checksum (catches typos)
const passesLuhn = (number) => {
  let sum = 0;
  [...number].reverse().forEach((char, index) => {
    let digit = Number(char);
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  });
  return sum % 10 === 0;
};

const isFutureExpiry = (value) => {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value);
  if (!match) return false;
  const now = new Date();
  const year = 2000 + Number(match[2]);
  const month = Number(match[1]);
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
};

export const paymentSchema = z.discriminatedUnion(
  "method",
  [
    z.object({
      method: z.literal("upi"),
      upiId: z
        .string()
        .trim()
        .min(1, "Enter your UPI ID")
        .regex(/^[\w.-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/, "Enter a valid UPI ID, like name@bank"),
    }),
    z.object({
      method: z.literal("card"),
      cardNumber: z
        .string()
        .transform(digits)
        .refine((value) => value.length >= 13 && value.length <= 19 && passesLuhn(value), "Enter a valid card number"),
      cardName: z
        .string()
        .trim()
        .min(2, "Enter the name on the card")
        .regex(/^[a-zA-Z .'-]+$/, "Use letters only"),
      cardExpiry: z.string().refine(isFutureExpiry, "Enter a valid expiry date (MM/YY)"),
      cardCvv: z.string().regex(/^\d{3,4}$/, "Enter the 3 or 4 digit CVV"),
    }),
    z.object({
      method: z.literal("netbanking"),
      bank: z.string().min(1, "Select your bank"),
    }),
    z.object({ method: z.literal("cod") }),
  ],
  { error: "Select a payment method" }
);

export const PAYMENT_DEFAULTS = { method: "", upiId: "", cardNumber: "", cardName: "", cardExpiry: "", cardCvv: "", bank: "" };
