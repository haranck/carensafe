# Payments (Razorpay) — Care N Safe

Online payments, wallet payments and top-ups, refunds, and how the moving parts fit together.
Test mode now; going live needs **only env changes**.

## Money rules

- Wallet, payment and refund code uses **integer paise**. Order `pricing.*` stays in rupees (as before); `order.payment`
  holds the paise split. Conversion happens at the edges only (`toPaise`).
- Prices are always recomputed on the server from the cart and live product data. Client amounts are never trusted.
- Every money change runs in **one MongoDB transaction** (`utils/transaction.js`, majority read/write, retried on
  transient errors). Razorpay is **never** called inside a transaction.
- Every money operation is **idempotent**:
  - Checkout: client `idempotencyKey` (unique per user on the order).
  - Wallet: unique `idempotencyKey` per transaction, e.g. `order:<id>`, `refund:<orderId>:<itemId>:wallet`,
    `topup:<razorpayPaymentId>`, `release:<orderId>`.
  - Payment: applied once per Razorpay payment (`finalizePayment` checks `razorpayPaymentId`).
  - Webhooks: `ProcessedWebhookEvent` (unique event id), written in the same transaction as the event's effects.
  - Refunds to the original method: claimed before calling Razorpay, and Razorpay's refunds are checked for our
    `notes.refundKey` first, so a retry never refunds twice.

## Payment methods at checkout

| Method | Body | Result |
|---|---|---|
| Cash on Delivery | `paymentMethod: 'cod'` | `confirmed`, payment `pending` until delivery (unchanged) |
| Wallet | `paymentMethod: 'wallet'` | wallet debited, `confirmed` + `paid` (needs balance ≥ total) |
| Online | `paymentMethod: 'razorpay'` | `pending_payment` + Razorpay order for the total |
| Wallet + Online | `paymentMethod: 'razorpay', useWallet: true` | wallet part debited now, the rest online (`pending_payment`). If the wallet covers everything it becomes a wallet order. Razorpay needs ≥ ₹1 online. |

`POST /api/user/orders` `{ addressId, paymentMethod, useWallet, idempotencyKey }` →
`{ orderId, orderNumber, paymentRequired, order, razorpay: { keyId, mode, orderId, amount, currency, name, description, prefill } | null }`.
One transaction reserves stock (409 listing sold-out items), creates the order, debits the wallet part and (COD /
wallet) clears the cart. The Razorpay order is created **after** the commit; if that fails the order is undone
(stock back, wallet part returned, `payment_failed`) and the API answers 502.

## Order payment states

```
              place (wallet only / COD) ──────────────────────────► confirmed (paid / pay on delivery)
place (online or wallet+online) ─► pending_payment ──verify/webhook/reconcile──► confirmed (paid)
                                     │   ▲  payment.failed → attempt recorded (retry allowed)
                                     │   └── POST /orders/:id/retry-payment (same Razorpay order, until expiresAt)
                                     ├── Razorpay order creation fails ─► payment_failed (stock back, wallet back)
                                     ├── customer / admin cancels ─► cancelled (Razorpay checked first)
                                     └── expiresAt passed, nothing captured ─► payment_expired (stock back, wallet back)
late capture on a closed order ─► stock + wallet part re-taken ─ok─► confirmed (paid)
                                                              └─no─► cancelled "Out of stock after payment" + FULL refund
Payment: created → attempted → (authorized →) captured → partially_refunded / refunded   |  expired  |  failed
```

## Wallet top-up states

```
POST /wallet/topup ─► Payment(created, purpose wallet_topup) ─verify/webhook─► captured + wallet credit (topup:<paymentId>)
                        │ payment.failed → attempt recorded
                        └ never paid → expired by the job (no money moved)
```

## Verification paths (all end in `paymentService.finalizePayment`)

1. **Verify** `POST /api/user/payments/verify` (checkout success handler): signature (HMAC-SHA256 of
   `order_id|payment_id`, timing-safe) → fetch the payment from Razorpay → order id, amount and currency must match →
   capture if only `authorized` → finalize.
2. **Webhook** `POST /api/payments/razorpay/webhook` (raw body, mounted before `express.json`), active when
   `RAZORPAY_WEBHOOK_SECRET` is set. Signature over the raw body (400 if wrong), deduped by `x-razorpay-event-id`.
   Handles `payment.captured`, `payment.authorized`, `order.paid`, `payment.failed`, `refund.processed`,
   `refund.failed`. Provider errors return 502 so Razorpay redelivers.
3. **Reconcile on read**: `GET /api/user/orders/:id` checks Razorpay for a `pending_payment` order (at most every
   20 s per order) — covers "paid, browser closed" without webhooks.
4. **Expiry job** (`src/jobs/payment.jobs.js`, every minute, one instance via a Redis lock): before expiring an order
   or top-up it asks Razorpay; anything captured/authorized is finalized instead of cancelled.

Edge cases handled: duplicate / double-click checkout, two tabs paying the same order (second capture refunded in
full), tampered amount/order (not applied, attempt logged), authorized-not-captured, late capture after expiry,
Razorpay down at checkout, verify + webhook + reconcile racing, redelivered webhooks, crash between "refund queued"
and "Razorpay called".

## Refunds

`orderService.refundForOrderItems` (cancel of a prepaid order, admin "return received"):
- Each line refunds its line total minus its share of the discount (`refundForItemPaise`).
- The refund is split between the wallet-paid and online-paid parts **in proportion** to how the order was paid,
  capped by what is left of each part (`splitRefund`) — never more than was paid.
- Wallet part → always back to the wallet.
- Online part → `REFUND_DESTINATION`:
  - `wallet` (default): instant wallet credit.
  - `source`: queued on the Payment (`refunds[].status: queued`), sent by the refund job after the transaction
    commits (`processing` → `pending` → `processed` / `failed` via webhook or status check). Failed after 5 tries →
    `failed` (needs manual action; logged).
- Payment status → `partially_refunded` / `refunded`; order `paymentStatus` likewise.
- COD: no automatic refund (unchanged; `pricing.refundableAmount` shows what to refund manually).

## Env vars (backend)

| Var | Required | Default | Notes |
|---|---|---|---|
| `RAZORPAY_KEY_ID` | yes | — | `rzp_test_…` now, `rzp_live_…` to go live. Mode is derived from it. |
| `RAZORPAY_KEY_SECRET` | yes | — | Never logged or sent to the client. |
| `RAZORPAY_WEBHOOK_SECRET` | no | — | Turns the webhook on. Set the same value in the Razorpay dashboard. |
| `PAYMENT_EXPIRY_MINUTES` | no | 15 | How long an unpaid order keeps its stock. |
| `REFUND_DESTINATION` | no | `wallet` | `wallet` or `source` (original method). |
| `WALLET_TOPUP_MIN` / `WALLET_TOPUP_MAX` | no | 100 / 10000 | Rupees. |

Startup logs `Razorpay mode: test|live · refunds to: … · webhook: on|off` (never keys).

## Rate limits

`paymentRateLimiter` (20 requests/minute per user, per IP when logged out) on place order, retry payment, cancel,
verify, failed and top-up. The webhook is not rate-limited. Behind a proxy, set Express `trust proxy` so the IP is right.

## How to test (test mode)

1. Restart the backend; the log should say `Razorpay mode: test`.
2. Checkout → **Pay Online** → in the Razorpay popup choose UPI and enter `success@razorpay` (or `failure@razorpay`).
   Cards: Razorpay's test cards (e.g. 4111 1111 1111 1111, any future expiry, any CVV); net banking: pick a bank and
   choose Success / Failure on the mock page.
3. Webhooks locally need a public URL (e.g. a tunnel) pointing at `/api/payments/razorpay/webhook`; without one,
   reconcile-on-read and the expiry job still confirm payments.

## Going live

1. Complete Razorpay KYC / account activation.
2. Generate live keys; set `RAZORPAY_KEY_ID=rzp_live_…` and `RAZORPAY_KEY_SECRET` on the server.
3. Dashboard → Webhooks: URL `https://<api-domain>/api/payments/razorpay/webhook` (HTTPS only), events:
   `payment.captured`, `payment.authorized`, `payment.failed`, `order.paid`, `refund.processed`, `refund.failed`;
   set the secret and the same `RAZORPAY_WEBHOOK_SECRET`.
4. If you add a Content-Security-Policy later, allow `checkout.razorpay.com` (script/frame), `api.razorpay.com` and
   `lumberjack.razorpay.com` (connect).
5. Payment capture: automatic capture in the dashboard is recommended; the code also captures `authorized` payments.
6. Decide `REFUND_DESTINATION` (`wallet` instant vs `source` to the original method).
7. Set `trust proxy` if behind a load balancer; keep the admin API protected (it is) and HTTPS everywhere.
