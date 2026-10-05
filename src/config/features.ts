// Guest checkout (COD only, phone OTP). Set NEXT_PUBLIC_GUEST_CHECKOUT_ENABLED
// to "true" in .env to turn it on. NEXT_PUBLIC_* values are inlined at build
// time, so changing it needs a rebuild. When off, checkout requires an
// account exactly as before.
export const GUEST_CHECKOUT_ENABLED =
  process.env.NEXT_PUBLIC_GUEST_CHECKOUT_ENABLED === "true";
