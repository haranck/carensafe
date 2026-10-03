# CLAUDE.md — Care N Safe

E-commerce app for an organic sanitary-pad brand: customer storefront + admin portal (users, products
with variants). Two independent apps:

```
carensafe/
├── backend/    Express 5 API, CommonJS, MongoDB (Mongoose) + Redis (ioredis)
└── frontend/   React 19 + Vite SPA, ES modules, Tailwind v4
```

## Commands

| | Backend (`cd backend`) | Frontend (`cd frontend`) |
|---|---|---|
| Dev | `npm run dev` (nodemon server.js, port `PORT`, default 3000) | `npm run dev` (Vite, :5173) |
| Prod | `npm start` | `npm run build` → `dist/`, `npm run preview` |
| Lint | none | `npm run lint` (ESLint flat config) |
| Tests | none (`npm test` just fails) | none |
| Smoke check | `node -e "require('./src/app')"` (loads all modules, no DB needed) | `npm run build` |

- Backend startup needs MongoDB **and** Redis reachable; `server.js` exits on either failure.
- Backend env is validated in `src/config/envValidation.js` (required: `MONGO_URI`, `JWT_ACCESS_SECRET`,
  `JWT_REFRESH_SECRET`; optional: `PORT`, `NODE_ENV`, `FRONTEND_URL`, `REDIS_URL`, `JWT_*_EXPIRES_IN`,
  `REFRESH_TOKEN_MAX_AGE`, `CLOUDINARY_*`). `utils/email.js` reads `SMTP_*`/`EMAIL_FROM` directly; without
  `SMTP_USER` the OTP is only logged to the console (`[Mock Email]`).
- Frontend needs `VITE_API_BASE_URL` pointing at the API **including `/api`** (API_ROUTES start at `/user/...`).
- Always import env via `require('../config/envValidation')`, not `process.env`.

---

## Backend

### Request flow

```
app.js mount → routes → middlewares → controller → service → repository → model
                (validation/upload/auth)   (req/res)   (logic)    (Mongoose)
```

Mounted in `src/app.js`: `/api/user/auth`, `/api/admin/auth`, `/api/admin/users`, `/api/admin/products`.
`globalErrorHandler` is registered last.

> The `user/user` feature files (`user.routes.js`, `user.controller.js`, `user.service.js`) are **empty**.
> The working reference flow is **user auth**: `routes/user/auth/auth.routes.js` →
> `controllers/user/auth/auth.controller.js` → `services/user/auth/auth.service.js` →
> `repositories/user/user.repository.js` → `models/user.model.js`. For admin CRUD with pagination copy
> `admin.user.*`.

### Layer rules

**Routes**: wiring only: path, middlewares, then an arrow wrapper to the controller instance:
```js
router.post('/login', validateLogin, (req, res) => authController.login(req, res));
router.put('/:id/variants/:variantId', upload.any(), (req, res) => adminProductController.updateVariant(req, res));
```
No logic, no DB, no response building.

**Controllers**: `class XController { async method(req, res) { try {...} catch {...} } }`, exported as
`module.exports = new XController()`.
- MAY: read `req.body/params/query/file(s)/cookies`, pick only the needed fields, parse pagination
  (`parseInt(req.query.page) || 1`, `limit || 10`, `search || ''`), set/clear cookies, call service(s), build the JSON response.
- MAY NOT: import models or repositories, contain business rules or DB queries.
  (`admin.product.controller.createProduct` has inline variant validation; that's legacy, don't copy it.)

**Services**: `class XService`, singleton export. All business rules live here.
- MAY: call repositories and `utils/*` (password, jwt, otp, redis, email), throw HTTP errors, normalize input
  (e.g. `email.trim().toLowerCase()`), strip sensitive fields (`delete userResponse.password`).
- MAY NOT: touch `req`/`res`, import Mongoose models directly.

**Repositories**: `class XRepository`, singleton export, one per entity. Thin Mongoose wrappers only.
- Return the query directly (no `await`) for single ops: `findById(id) { return User.findById(id); }`
- Updates use `{ returnDocument: 'after', runValidators: true }`.
- Paginated list returns `{ data, total, page, limit, totalPages }` (see `findAll` in `user.repository.js`).
- MAY NOT: throw HTTP errors, contain business rules, build filters from request input (services build `filter`).

**Models**: `models/<entity>.model.js`, singular, `timestamps: true`, `module.exports = mongoose.model('X', schema)`.

### File naming and folders

| Layer | User side | Admin side |
|---|---|---|
| Route | `routes/user/<feature>/<feature>.routes.js` | `routes/admin/admin.<feature>.routes.js` (flat, no subfolder) |
| Controller | `controllers/user/<feature>/<feature>.controller.js` | `controllers/admin/<feature>/admin.<feature>.controller.js` |
| Service | `services/user/<feature>/<feature>.service.js` | `services/admin/<feature>/admin.<feature>.service.js` |
| Repository | `repositories/user/<entity>.repository.js` (shared by admin services) | `repositories/admin/` exists but is empty; don't create admin duplicates |
| Mount | `app.use('/api/user/<feature>', ...)` | `app.use('/api/admin/<feature>', ...)` |

Class names: `AuthController`, `AdminUserService`, `ProductRepository`. Instances: `authController`, `adminUserService`.

### Response shapes (always)

```js
// success
res.status(200|201).json({ success: true, message: 'Users retrieved successfully', data });
// paginated list
res.status(200).json({ success: true, message, data: result.data,
  pagination: { total, page, limit, totalPages } });
// error
res.status(statusCode).json({ success: false, message });
```
201 for creates. Never send `password` or `refreshToken` in a body. Login returns
`data: { user: { id, firstName, lastName, email, isAdmin }, accessToken }` plus an httpOnly
`refreshToken` cookie (`sameSite: 'strict'`, `secure` in production, `maxAge: env.REFRESH_TOKEN_MAX_AGE`).

### Errors

Services throw; controllers catch and respond:
```js
// service
const error = new Error('User with this email already exists.');
error.statusCode = 409;
throw error;

// controller catch block (identical in every controller)
} catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: error.message || 'Internal Server Error' });
}
```
`middlewares/error.middleware.js` (`globalErrorHandler`) is only a safety net: it handles `multer.MulterError`
(400 `Upload Error: ...`, raised by `upload.*` before the controller runs) and anything uncaught (Express 5
forwards rejected promises). Same JSON shape. Keep the controller try/catch pattern for new code.

### Auth

- `utils/jwt.js` signs `{ userId }` (there are no roles; admins are `isAdmin: true`). Access token 15m, refresh 7d. Refresh rotation and logout
  blacklist the old token in Redis (`blacklist:<token>`).
- `middlewares/auth.middleware.js` (default export) expects `Authorization: Bearer <token>`, verifies it and sets
  **`req.user = { userId }`**. 401 `{ success:false, message }` otherwise. It does **not**
  check `isBlocked` or `isAdmin`. It's currently not mounted anywhere (see Known issues). Protect new user
  routes with it: `router.get('/', authMiddleware, (req, res) => ...)` and read `req.user.userId`.
- Signup is a two-step OTP flow. Pending signup data lives in Redis `signup:<email>` (300s) with
  `otp_attempts:<email>` (max 3). The user is created only in `verifyOtp`.

### Validation (Joi)

`middlewares/auth.validation.js` defines Joi schemas + a middleware per schema:
```js
const validateLogin = (req, res, next) => {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });
    next();
};
```
Placed in the route before the controller. Note: the validated value isn't written back to `req.body`, so
Joi `.trim()` has no effect and services must still normalize. For a new feature create
`middlewares/<feature>.validation.js` with the same shape. Keep the frontend zod schema's rules identical.

### Uploads

`middlewares/upload.middleware.js` = Multer + `multer-storage-cloudinary` (folder `carensafe/products`,
jpg/jpeg/png/webp, 5 MB). `upload.single('avatar')` → `req.file.path` is the URL. `upload.any()` → filter
`req.files` by `fieldname` (products use `images_<variantIndex>`). Store images as `{ url: file.path, publicId: file.filename }`.

### Checklist: adding a backend feature (e.g. cart)

1. Model: `src/models/cart.model.js` (singular, `timestamps: true`). Check existing models first.
2. Repository: `src/repositories/user/cart.repository.js`, thin queries, singleton export.
3. Service: `src/services/user/cart/cart.service.js`, business rules, throws `Error` with `statusCode`.
4. Validation: `src/middlewares/cart.validation.js`, Joi schema + `validateX` middleware (400 shape above).
5. Controller: `src/controllers/user/cart/cart.controller.js`, try/catch, standard response shape.
6. Routes: `src/routes/user/cart/cart.routes.js`, `authMiddleware` + validation + arrow wrapper.
7. Mount in `src/app.js`: `app.use('/api/user/cart', cartRoutes)` next to the other `require`s.
8. Admin counterpart? Use `admin.cart.*` names in `routes/admin/`, `controllers/admin/cart/`, `services/admin/cart/`,
   reuse the same repository, mount at `/api/admin/cart`.
9. Run `node -e "require('./src/app')"`, then hit the endpoint with the dev server running.

---

## Frontend

### Structure and data flow

```
routes/ (UserRoutes | AdminRoutes) → pages/<Feature>/XPage.jsx → components/<Feature>/X.jsx
  → hooks/<Feature>/<Feature>Hooks.js (TanStack Query) → services/<Feature>/<feature>Service.js
  → api/axios.js (AxiosInstance) → backend
```

- `main.jsx`: Redux `Provider` → `PersistGate` → `QueryClientProvider` → `BrowserRouter` → `App`.
- `App.jsx`: global `<Toaster>` (react-hot-toast, already styled) + `/*` → `routes/user/UserRoutes.jsx`,
  `/admin/*` → `routes/admin/AdminRoutes.jsx` (relative child paths inside `AdminDashboardLayout`).
- `routes/PublicRoute.jsx` / `ProtectedRoute.jsx`: wrap groups of user routes; both only check `state.token.accessToken`.
- `api/axios.js`: `AxiosInstance` with `baseURL = VITE_API_BASE_URL`, `withCredentials`, attaches the Bearer
  token from Redux. On 401 (except login/signup/otp) it calls `/user/auth/refresh` once and retries.
  Always use `AxiosInstance`, never bare `axios`.

**Service** (plain async fn, returns `response.data`, i.e. the `{ success, message, data }` envelope):
```js
export const loginUser = async (data) => {
    const response = await AxiosInstance.post(API_ROUTES.AUTH.LOGIN, data);
    return response.data;
};
```
**Hook** (one hook per endpoint):
```js
export const useBlockUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: blockUser,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_users"] }),
    });
};
export const useGetAllUsers = (page, limit, search) =>
    useQuery({ queryKey: ["admin_users", page, limit, search], queryFn: () => getAllUsers(page, limit, search) });
```
Query keys are snake_case strings + params (`["admin_products", page, limit, search]`). Mutations invalidate the
key prefix. For paginated lists use `placeholderData: keepPreviousData` (v5). The existing
`keepPreviousData: true` is a v4 option and is ignored.

### React Query vs Redux

- **TanStack Query**: all server data and every API call (lists, details, mutations). Components never call
  services directly or store fetched data in `useState`.
- **Redux** (persisted to localStorage, key `root`): only `auth` (`setAuthUser`, `clearAuth`) and `token`
  (`setAccessToken`, `clearAccessToken`). After login:
  `dispatch(setAccessToken(res.data.accessToken)); dispatch(setAuthUser(res.data.user));`
  Don't add slices for server data.
- Local UI state (modal open, tab, search input) → `useState`. Debounce search 400ms and reset page to 1
  (see `AdminUsersPage.jsx`).

### Forms (react-hook-form + zod)

Pattern from `components/Auth/LoginForm.jsx`:
- zod schema at top of the component file, `useForm({ resolver: zodResolver(schema), mode: "onTouched" })`.
- Inputs use `{...register("field")}`, errors shown under each field via `errors.field?.message`.
- Submit calls `mutate(data, { onSuccess, onError })`. Show the API error from
  `error?.response?.data?.message`. Disable the submit button and show a spinner while `isPending`.
- Mirror the backend Joi rules exactly (password: min 8, upper, lower, digit, special char).
- `AdminAddProductPage` uses a hand-rolled `useState` form. That's legacy; new forms use RHF + zod.
- File uploads: build `FormData` and let the service send it (see `createProduct`, `updateVariant`).

### Constants

- `constants/apiRoutes.js` → `API_ROUTES.<GROUP>.<ACTION>`; static strings or functions for params:
  `UPDATE_VARIANT: (id, variantId) => \`/admin/products/${id}/variants/${variantId}\``. No URL literals in services.
- `constants/frontendRoutes.js` → `FRONTEND_ROUTES.<NAME>` for page paths. Use it in `<Route>`, `navigate()`, `<Link>`.
- `constants/errorMessages.js` → backend message strings the UI matches on (must equal the backend text exactly).

### Checklist: adding a frontend feature (e.g. Cart)

1. `constants/apiRoutes.js`: add `CART: { GET: "/user/cart", ADD: "/user/cart", REMOVE: (id) => ... }`.
2. `constants/frontendRoutes.js`: add `CART: "/cart"` (admin pages: `ADMIN_X: "/admin/x"`).
3. `services/Cart/cartService.js`: async fns returning `response.data`.
4. `hooks/Cart/CartHooks.js`: `useGetCart` (useQuery), `useAddToCart` (useMutation + invalidate `["cart"]`).
5. `components/Cart/*.jsx`: presentational pieces + forms (RHF + zod). Shared bits go in `components/common/`.
6. `pages/Cart/CartPage.jsx`: composes components and wires hooks, handles loading/empty/error.
7. Register in `routes/user/UserRoutes.jsx` (inside `ProtectedRoute` if auth needed) or `routes/admin/AdminRoutes.jsx`
   (relative path inside the layout route) using `React.lazy` + `Suspense`. Add admin nav entries to `AdminSidebar.jsx` `NAV_ITEMS`.
8. Run `npm run lint` (no new errors in touched files) and `npm run build`.

Folders are PascalCase per feature (`Auth/`, `Admin/`, `Cart/`). Admin features go under `Admin/<Feature>/` in
`pages/` and `components/`. New admin services/hooks go in `services/Admin/<feature>Service.js` and
`hooks/Admin/<Feature>Hooks.js`, not appended to the flat `services/AdminService.js`.

### UI standards for new pages

- **Tailwind utility classes only**, no new CSS files and no inline `style` (except existing gradients).
  Never build class names dynamically (`bg-${color}-50` isn't generated); map to full class strings.
  `tailwind.config.js` is **not** read by Tailwind v4, so don't add theme tokens there.
- `index.css` sets a dark `body` background, so every page sets its own root background.
- **Customer theme** (`pages/LandingPage.jsx`, `HomePage.jsx`, auth pages): root
  `min-h-screen flex flex-col font-sans` + a background, with `<Header />` (floating capsule, `components/Layout/HeaderParts/`)
  + `<Footer />`. Use the class constants in `constants/customerTheme.js`: `CONTAINER`
  (`max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8`, shared by header, sections and footer), `CONTAINER_BLEED` for
  edge-to-edge horizontal scrollers, `PAGE_BACKGROUND` (off-white `#fbf8fc` + soft radial washes), `BRAND_GRADIENT`,
  `PINK_BUTTON`, `FOCUS_RING`. Alternate section bands (off-white / white / blush gradients) and prefer CSS radial
  gradients over large `blur-[…]` blobs. Section headings: `components/Home/SectionHeading` (eyebrow pill + one
  `font-accent italic` serif word). Headings `text-[#1e1a3a] font-extrabold`, accent `#d6008a`, brand gradient
  `bg-gradient-to-r from-[#3b2a8a] via-[#7c3aed] to-[#d6008a]` (primary buttons, highlighted text with
  `bg-clip-text text-transparent`). Cards `bg-white border border-slate-100 rounded-2xl` with hover
  `hover:shadow-[0_8px_24px_rgba(59,42,138,0.10)] hover:-translate-y-1 transition-all duration-200`.
- **Admin theme** (rendered inside `AdminDashboardLayout`): wrapper `p-6 max-w-7xl mx-auto`, slate text,
  `indigo-600` primary buttons (`rounded-xl font-bold`), cards `bg-white rounded-2xl border border-slate-100 shadow-sm`,
  tables in `overflow-x-auto` with `bg-slate-50/80` uppercase `text-[12px]` headers, status pills
  emerald (active) / rose (blocked/inactive), `components/common/Pagination.jsx` for lists.
- **Mobile-first**: base classes for phones, then `sm:`/`md:`/`lg:`. Grids collapse to `grid-cols-1`, no fixed
  widths without a responsive fallback (`w-full sm:w-[320px]`), tables scroll horizontally.
- **Lazy-load** every new page route: `const CartPage = lazy(() => import("../../pages/Cart/CartPage"));` inside
  `<Suspense fallback={<spinner/>}>`.
- **Every data view has 3 states**: loading (`Loader2` from lucide with `animate-spin`, or skeleton), empty
  (icon + title + hint, see `AdminProductsPage`), error (rose message + retry where sensible).
- **Feedback via toast**: `toast.success/error` from `react-hot-toast` inside mutation `onSuccess/onError`.
  Never call `toast` in the render body. Inline rose banners are fine for form-level API errors.
- **Icons**: `lucide-react` only.
- **Motion**: `framer-motion` via `LazyMotion` + `domAnimation` + `m.*` components (see `Header.jsx`, `HomePage.jsx`,
  `components/Home/Reveal.jsx`) for subtle enter animations only: opacity + 8–16px y, 0.2–0.3s. Use it for page
  sections and modals, not on every list row.

---

## Rules for Claude

- Follow the existing patterns above. Read the nearest sibling file before writing a new one and match its style.
- Make the smallest change that solves the task. Don't refactor, rename or reformat unrelated code, and don't fix
  Known issues unless asked (mention them if relevant).
- **No new npm packages** (either app) without asking first. Everything listed in package.json is available.
- Before any change touching more than ~2 files, or both apps, write a short plan (files + what changes) and get confirmation.
- After changes: frontend `npm run lint` + `npm run build`; backend `node -e "require('./src/app')"`.
  Lint has a pre-existing baseline of 17 errors / 2 warnings, so don't add new ones and report the before/after.
- Backend stays CommonJS (`require`/`module.exports`), frontend stays ESM `.jsx`/`.js`. No TypeScript files.
- Never read, edit, print or commit `.env` files or secrets; never hardcode credentials or URLs that belong in env.
  Add new env vars to `envValidation.js` and tell the user which to set.
- When adding an endpoint, update both sides consistently: route, `API_ROUTES`, service, hook, and matching validation.
- Don't commit or push unless asked.

---

## Known issues (as of 2026-10-03)

**Security**
- **Admin API is unauthenticated**: `/api/admin/users` and `/api/admin/products` have no middleware;
  `authMiddleware` is never mounted; there's no admin-role check (the JWT has no `isAdmin`). Admin login
  (`admin.auth.service`) returns no token, and `AdminLoginForm` just navigates. `/admin/*` frontend routes have no guard.
- Global rate limiter is commented out in `app.js`; login/OTP endpoints are unthrottled.
- OTP brute-force guard is weak: a wrong attempt resets `otp_attempts:<email>` TTL to 30s while the signup key lives 300s.
- `authMiddleware` ignores `isBlocked`, so blocked users keep access until the access token expires.
- `frontend/.env` is tracked in git (`frontend/.gitignore` doesn't ignore `.env`).
- Frontend logout only clears Redux; it never calls `/user/auth/logout`, so the refresh cookie stays valid.

**Bugs**
- `infrastructure/cache/redisClient.js` falls back to `env.REDIS_HOST/REDIS_PORT`, which `envValidation.js` never
  exports (`parseRedisHost/parseRedisPort` are unused). It only works because ioredis defaults to localhost:6379.
- OTP email text says "expires in 30 seconds"; actual TTL is 300s.
- `USER_ERRORS.USER_BLOCKED = "User is blocked"` doesn't match the backend ("Your account is blocked."), so the
  axios blocked-user redirect never fires (and the backend returns 403 there only on login/refresh).
- Signup zod schema is weaker than Joi (no lowercase/special-char rule), so the server rejects passwords the form accepts.
- `ProductModal.jsx` calls hooks after an early `return null` (rules-of-hooks) and imports via `'../../../src/hooks/...'`.
- `AdminProductsPage` calls `toast.error` during render. `keepPreviousData: true` in `AdminHooks.js` is ignored (v5).
- `AdminDashboardPage` uses dynamic Tailwind classes (`bg-${statusColor}-50`) and hardcoded mock stats/orders.
- Users without a password (e.g. old partner accounts) make `bcrypt.compare` throw on login → 500 instead of 401.
- Cloudinary uploads happen before controller validation; rejected requests and removed variant images are never
  deleted (orphans).

**Structure / inconsistencies**
- Empty, unmounted stubs: `routes/user/user/user.routes.js`, `controllers/user/user/user.controller.js`,
  `services/user/user/user.service.js`, `routes/user/order/order.routes.js`, `routes/user/products/products.routes.js`.
  No order/cart model, controller or service exists.
- `repositories/admin/` is empty; admin services use `repositories/user/*`. `repositories/user/auth/auth.repository.js`
  duplicates `user.repository.js` and is used only by `admin.auth.service.js`. `AuthService.adminLogin` is dead code
  duplicating `AdminAuthService.adminLogin`.
- Joi covers only signup/login. Verify-OTP, resend-OTP and all admin endpoints validate ad hoc (some in controllers).
- `utils/email.js` reads `process.env` directly. There's no `.env.example` in either app.
- Backend has both `redis` and `ioredis` installed (only `ioredis` is used), plus `typescript`/`@types/node`
  devDeps with no TS in the project. There's no backend lint or tests anywhere.
- `backend/test_real.png` (1×1 test image) is committed in the backend root.
- Frontend: flat `services/AdminService.js` + single `hooks/Admin/AdminHooks.js` instead of per-feature folders.
- Service and hook file casing is mixed (`Auth/authService.js`, `AdminService.js`, `AuthHooks.js`).
- `AdminRoutes.jsx` redefines a local `FRONTEND_ROUTES`. Many paths are hardcoded (`"/home"`, `"/admin/products"`,
  axios `/user/auth/refresh`). `FRONTEND_ROUTES` lacks the admin sub-pages.
- `pages/Auth/AuthPage.jsx` is unused (not routed) and has lint errors. Login, Signup and Auth pages duplicate the same branding block.
- Links to routes that don't exist: `/shop`, `/orders`, `/wishlist`, `/about`, `/technology`, `/care-shorts`,
  `/contact`, `/profile`, `/forgot-password`. There's no 404 route. Only `/home` is lazy-loaded.
- `index.css` has a leftover dark theme, unused `.glass-*`/`.btn-*`/`.input-field` classes and `.Toastify__*`
  overrides (the app uses react-hot-toast). `tailwind.config.js` is ignored by v4, autoprefixer in
  `postcss.config.js` is redundant, and `App.css` is empty.
- Admin sidebar (`w-64`, open by default) isn't mobile-friendly. `AdminHeader` shows hardcoded "System Admin"
  and its email.
- `frontend/README.md` is the stock Vite template.
