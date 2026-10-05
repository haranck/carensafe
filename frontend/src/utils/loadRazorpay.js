// Razorpay Checkout script, loaded once on first use (cached promise; a failed load can be retried)
const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let loading = null;

export const loadRazorpay = () => {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = CHECKOUT_SRC;
      script.async = true;
      script.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("Razorpay unavailable")));
      script.onerror = () => reject(new Error("Razorpay unavailable"));
      document.body.appendChild(script);
    }).catch((error) => {
      loading = null;
      throw error;
    });
  }
  return loading;
};
