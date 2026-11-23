# Care N Safe

Full-stack e-commerce application for Care N Safe.

- **Frontend:** React 19, Vite 8, Redux Toolkit, React Query, Tailwind CSS, PWA support
- **Backend:** Node.js, Express 5, MongoDB/Mongoose
- **Cache:** Redis
- **Integrations:** Cloudinary, SMTP email, Google OAuth, Razorpay, Mapbox

## Repository layout

```text
carensafe-push/
├── backend/
│   ├── src/
│   ├── scripts/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
└── docker-compose.yml
```

## Prerequisites

Choose one setup:

- **Recommended for development:** Node.js 24, MongoDB, and Redis installed locally
- **MongoDB or Redis hosted:** only Node.js and Docker (optional) are needed locally
- **Docker Compose:** Docker Engine/Desktop and Docker Compose

Check your tools:

```bash
node --version
npm --version
docker --version
docker compose version
```

Use Node.js 24 for this repository, especially for Docker. Node.js 22 or newer is required by one of the authentication dependencies.

## Security warning

Do **not** share real credentials from `.env` files. In particular, rotate or replace MongoDB passwords, JWT secrets, Razorpay keys, Cloudinary secrets, SMTP app passwords, Google OAuth secrets, Redis passwords, and Mapbox tokens before sharing a ZIP or publishing code.

You can create a clean environment by copying the included `.env.example` files and removing any existing `.env` values that belong to another machine or account.

```bash
# Linux/macOS
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Windows PowerShell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

## 1. Backend setup

From the project root:

```bash
cd backend
npm ci
cp .env.example .env
```

On Windows PowerShell:

```powershell
cd backend
npm ci
Copy-Item .env.example .env
```

Edit `backend/.env`:

| Variable | Required | Description |
|---|---:|---|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Yes | Long random secret for access tokens |
| `JWT_REFRESH_SECRET` | Yes | Long random secret for refresh tokens |
| `RAZORPAY_KEY_ID` | Yes | Razorpay test or live key ID |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay test or live key secret |
| `PORT` | No | Backend port; default `3000` |
| `NODE_ENV` | No | `development` or `production` |
| `FRONTEND_URL` | No | Browser frontend URL; default `http://localhost:5173` |
| `REDIS_URL` | Recommended | Redis URL, for example `redis://127.0.0.1:6379` |
| `JWT_ACCESS_EXPIRES_IN` | No | Access-token lifetime; default `15m` |
| `JWT_REFRESH_EXPIRATION` | No | Refresh-token lifetime; default `7d` |
| `REFRESH_TOKEN_MAX_AGE` | No | Refresh-cookie lifetime in milliseconds; default `604800000` |
| `CLOUDINARY_CLOUD_NAME` | For uploads | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | For uploads | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | For uploads | Cloudinary API secret |
| `SMTP_HOST` | For email | SMTP host |
| `SMTP_PORT` | For email | SMTP port; default `587` |
| `SMTP_USER` | For email | SMTP username |
| `SMTP_PASS` | For email | SMTP password or app password |
| `SMTP_FROM` | For email | Sender email address |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth web client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth web client secret |
| `CONTACT_EMAIL_TO` | Optional | Inbox for contact messages; falls back to `SMTP_USER` |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | Required for reliable/production webhook validation |
| `PAYMENT_EXPIRY_MINUTES` | No | Payment reservation timeout; default `15` |
| `REFUND_DESTINATION` | No | `wallet` or `source`; default `wallet` |
| `WALLET_TOPUP_MIN` | No | Minimum wallet top-up in rupees; default `100` |
| `WALLET_TOPUP_MAX` | No | Maximum wallet top-up in rupees; default `10000` |

Generate suitable secrets:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Run this command twice and use separate values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

### Start local MongoDB and Redis

With Docker:

```bash
docker run --name carensafe-mongo -d -p 27017:27017 mongo:8
docker run --name carensafe-redis -d -p 6379:6379 redis:alpine
```

Then use:

```dotenv
MONGO_URI=mongodb://127.0.0.1:27017/carensafe
REDIS_URL=redis://127.0.0.1:6379
```

MongoDB Atlas or another hosted MongoDB provider can be used instead.

### Start the backend

Development with nodemon:

```bash
npm run dev
```

Normal start:

```bash
npm start
```

The API should be available at:

```text
http://localhost:3000
```

The backend exits immediately if MongoDB, required environment variables, or Redis cannot be initialized.

## 2. Frontend setup

Open a second terminal at the project root:

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

On Windows PowerShell:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

The frontend should be available at:

```text
http://localhost:5173
```

For local development, set:

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=your_google_web_client_id
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_public_token
```

The Google and Mapbox variables are optional. If omitted, their related features are disabled or use no token.

## Frontend commands

```bash
npm run dev       # Start Vite development server
npm run build     # Create production build in dist/
npm run preview   # Preview the production build locally
npm run lint      # Run ESLint
```

## Backend commands

```bash
npm run dev       # Start with nodemon
npm start         # Start with Node.js
npm run build     # Copy runtime files into dist/
npm test          # Currently no test suite is configured
```

## Docker setup

The root `docker-compose.yml` runs the backend and Redis. It uses `backend/.env` and starts Redis on the container network.

Start it from the project root:

```bash
docker compose up --build -d
```

View logs:

```bash
docker compose logs -f backend
docker compose logs -f redis
```

Check running containers:

```bash
docker compose ps
```

Stop:

```bash
docker compose down
```

Stop and remove containers, network, and Redis data:

```bash
docker compose down --volumes
```

The Docker setup exposes the backend at `http://localhost:3000` and Redis at `localhost:6380`. The backend connects to Redis internally at `redis://redis:6379`.

Set `FRONTEND_URL` in `backend/.env` to the address that serves the frontend. Local Docker plus local Vite normally uses:

```dotenv
FRONTEND_URL=http://localhost:5173
```

The root Compose file does not build or serve the React frontend. Run Vite separately, or add/deploy a frontend container or static hosting configuration.

## Database maintenance scripts

Wishlist migration:

```bash
cd backend

# Preview changes without modifying the database
node scripts/migrate-wishlist-variants.js --dry-run

# Apply the migration
node scripts/migrate-wishlist-variants.js
```

Remove deprecated user role fields:

```bash
cd backend
node scripts/removeUserRole.js
```

Always back up the database before running an applied migration.

## Production notes

Before production:

1. Replace all test credentials and use production databases and Redis instances.
2. Set secure, unique JWT secrets.
3. Replace Razorpay test keys with live keys.
4. Configure `RAZORPAY_WEBHOOK_SECRET` and register the backend webhook URL.
5. Set `FRONTEND_URL` to the exact production frontend origin.
6. Set `VITE_API_BASE_URL` to the production API URL, including `/api`.
7. Configure HTTPS and correct cookie, CORS, and proxy settings.
8. Use a production process manager or container platform.
9. Restrict MongoDB, Redis, and provider credentials to the smallest required access.

Example Razorpay webhook route:

```text
https://your-api-domain.example/api/payments/razorpay/webhook
```

Build the frontend:

```bash
cd frontend
npm ci
npm run build
```

Deploy the generated `frontend/dist/` directory to a static host and configure SPA fallback so application routes serve `index.html`.

Build the backend runtime image:

```bash
docker compose build backend
```

## Troubleshooting

### Backend exits with “Missing required environment variable”

Confirm `backend/.env` exists and contains:

- `MONGO_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Restart the backend after changing environment variables.

### MongoDB connection fails

- Check whether the MongoDB service/container is running.
- Verify the username, password, database name, replica set, and `authSource`.
- If the backend runs in Docker and MongoDB runs on your host, use the appropriate host name rather than `127.0.0.1`.
- For Atlas, allow the machine or server IP in Network Access.

### Redis connection fails

- Local: `redis://127.0.0.1:6379`
- Docker Compose: `redis://redis:6379`
- Redis with authentication: `redis://username:password@host:port`

### CORS error in the browser

Set `FRONTEND_URL` in `backend/.env` to the exact frontend origin, including protocol and port.

Example:

```dotenv
FRONTEND_URL=http://localhost:5173
```

### Frontend cannot reach the backend

Restart Vite after editing `frontend/.env`, and use the API URL including `/api`:

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api
```

### Google login is hidden

Set a valid `VITE_GOOGLE_CLIENT_ID` in `frontend/.env`, then restart Vite. The backend `GOOGLE_CLIENT_SECRET` must also be set for server-side Google authentication.

### Emails are not sent

Verify SMTP host, port, username, sender address, and app password. Gmail and many providers require an app password rather than the normal account password.

## Before sharing as a ZIP

Recommended exclusions:

```text
.git/
node_modules/
frontend/dist/
backend/dist/
backend/.env
frontend/.env
*.log
```

Include both `.env.example` files and all package-lock files. The recipient should copy the example files to `.env` and add their own credentials.
