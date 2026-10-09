# RoutePilot — deployable logistics tracking application

RoutePilot is a Node.js/Express application with persistent JSON storage, JWT-protected tracking APIs, role-scoped map endpoints, real OpenStreetMap tiles, OSRM road-route geometry, driver-only GPS sharing/navigation, alternate-route selection, and optional SMS alerts. It uses a single Express instance and a persistent disk; do not run multiple instances against the same JSON file. For high-volume or multi-instance production, move the state store to PostgreSQL and use a managed routing service.

## Requirements
- Node.js 20+
- Internet access for map tiles, Leaflet CDN, and OSRM route geometry

## Run locally in VS Code
1. Open the folder containing `server.js`, `index.html`, and `package.json` in VS Code.
2. Open **Terminal → New Terminal**.
3. Run `npm install`.
4. Copy `.env.example` to `.env`. Change the passwords and `JWT_SECRET` before first run.
5. Run `npm start`.
6. Open the URL printed by the terminal (usually `http://localhost:3001` if you copied the provided `.env.example`; otherwise `http://localhost:3000`).

The server creates `data/routepilot.json` on first startup. Seed passwords only apply when that file is first created. If you have already started the app, changing environment passwords will not reset existing accounts. Keep the data file safe.

## Seed account IDs and initial passwords
These are **development/bootstrap credentials only**. Set environment passwords before the first startup and change them after initial login. Do not publish these defaults on a public deployment.

| Role | Login ID(s) | Initial password if environment variables are not changed |
|---|---|---|
| Owner | `owner` | `owner123` |
| Operator | `OP-01`, `OP-02` | `operator123` |
| Driver | `T-01` through `T-10` | `driver123` |
| Customer | `C-01` through `C-10` | `customer123` |

`OWNER_PASSWORD`, `OPERATOR_PASSWORD`, `DRIVER_PASSWORD`, and `CUSTOMER_PASSWORD` set the respective role passwords on a **fresh data file**. Passwords are stored as salted PBKDF2 hashes.

## Maps and roles
- **Owner / Operator:** real map with all configured routes and fleet markers. Map positions refresh while the map page is open; live GPS is available when drivers have enabled sharing.
- **Customer:** sees only vehicles assigned to that customer's open deliveries via `/api/map/vehicles`.
- **Driver:** sees driver navigation for their own vehicle; GPS is sent only after browser permission and the driver starts navigation/sharing.
- **Reroute:** authenticated owner/operator or the driver of that vehicle can request a configured alternate. The route choice is application logic; it is not a guarantee of live traffic optimization.

The map style is inspired by live-tracking apps, but it is **not connected to Flipkart's private systems or an official Indian Railways live-train API**. It tracks RoutePilot vehicles using their browser GPS. Public OpenStreetMap tiles and the public OSRM demo service are used by default; use a commercial/dedicated tile and routing provider for production traffic.

## Deploy the full app to Render (recommended; Netlify static hosting alone will not run Express APIs)
1. Push the files in this folder directly to the root of a private Git repository (there is no enclosing project folder).
2. Create a Render **Web Service** from the repository. Build command: `npm install`; start command: `npm start`.
3. Add a persistent disk mounted at `/var/data`. Set `DATA_DIR=/var/data`.
4. Set `NODE_ENV=production`, `JWT_SECRET` to a generated random secret (at least 32 characters), and strong role passwords in the host's environment settings.
5. Deploy. Test `/api/health` and then sign in through the HTTPS site.
6. Keep only one running instance while JSON storage is used. Do not use ephemeral-only storage if you need to retain users, deliveries, and GPS state across restarts.

`render.yaml` is included as a deployment starting point. Review the host's disk/plan availability before deploying.

## Optional SMS alerts
Configure `SMS_PROVIDER=twilio` with `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_FROM`, or `SMS_PROVIDER=msg91` with `MSG91_AUTHKEY` and `MSG91_TEMPLATE_ID`. Leave `SMS_PROVIDER` unset to disable SMS. India delivery through MSG91/other Indian routes may require DLT-registered sender IDs and approved templates. The authenticated `POST /api/send-sms` endpoint is owner/operator-only.

## API overview
- `GET /api/health` — health check
- `POST /api/login` — issues a 12-hour JWT
- `GET /api/map/vehicles` — role-filtered vehicle map data (Bearer token required)
- `POST /api/location` — driver-only GPS update
- `POST /api/location/stop` — driver-only GPS sharing stop
- `POST /api/reroute` — role-checked reroute
- `GET /api/tracking/:vehicleId` — authorized single-vehicle tracking
- `GET/PUT /api/state` — management state endpoints for owner/operator accounts
- `POST /api/send-sms` — optional owner/operator SMS

## Important deployment notes
This is a deployable single-instance application scaffold, not a certified commercial logistics platform. Before real business use, add PostgreSQL migrations/backups, account-specific password rotation, operational monitoring, data-retention policies, and a dedicated route/tiles provider. Do not use real customer data until those operational controls are reviewed.


## AI Help chatbot and support tickets

A floating Help / AI button appears on authenticated dashboards. The `/api/chat` endpoint uses the OpenAI Responses API when `OPENAI_API_KEY` is configured on the server. The key must never be placed in browser code. If no key is configured, a built-in RoutePilot help assistant answers common questions. Configure `OPENAI_API_KEY` in your deployment environment and optionally `OPENAI_MODEL` (default `gpt-4.1-mini`). Chat is authenticated and rate-limited. “Contact support” creates a persisted support ticket; it does not automatically email anyone. Owner/support staff need a separate ticket-view workflow or notification integration to respond to tickets.

## Optional Mappls driver navigation

The driver navigation map can use the official Mappls (MapmyIndia) Web Maps SDK. Create a Web Maps key in the [Mappls Console](https://auth.mappls.com/console), enable the relevant web map access, and set `MAPPLS_MAP_KEY` in your local `.env` or deployment environment. Restrict the key to your local/deployed domains in the Mappls Console. The key is delivered only to authenticated driver accounts because browser maps require a client-side key; domain restrictions are essential. Without this key, driver navigation falls back to the existing Leaflet/OpenStreetMap implementation. Owner/operator/customer maps remain unchanged.

Mappls official docs: https://developer.mappls.com/documentation/sdk/Web/Web%20JS/

## Railway-style shipment tracking for owner, operator, and customer

The Owner and Operator Network/Fleet maps and the Customer delivery map now include a shipment-tracking board with route checkpoints, vehicle status, GPS freshness, and an estimated route-progress bar when a recent driver GPS fix is available. Map vehicle markers and tracking cards refresh about every 15 seconds while a map is open. Intermediate route checkpoints are shown on the map.

For genuine live tracking, the driver must sign in and start Driver Navigation (or the existing GPS sharing flow) and allow browser location access. GPS requires HTTPS in production (localhost is permitted for local development). If GPS is not being shared, the tracking board explicitly shows that it is waiting for GPS; any fallback marker is only an approximate last-known/origin position. Route progress is an estimate based on the latest GPS point and route geometry, not a guaranteed ETA or a railway-grade tracking feed.

## Customer tracking board fix

The customer tracking board now requests its assigned active deliveries, routes, and permitted vehicles from the authenticated `/api/customer/tracking` endpoint. This avoids relying on stale browser-local delivery data when the owner/operator updates assignments. Customers can only receive vehicles assigned to their own active deliveries. The board refreshes tracking data while open.

## Reset all account passwords (local development)

This version resets all existing browser-saved account passwords once when the updated app is opened, while preserving routes, deliveries, theme, recommendation settings, and other saved app data. Stop the server (`Ctrl+C`) and run:

```bash
npm run reset-all-passwords
npm start
```

The reset command makes a timestamped backup of the configured JSON data file before changing passwords. It resets all existing Owner, Operator, Driver, and Customer password hashes. The browser migration also updates any existing browser-local account hashes and clears the old login lockout. If `DATA_DIR` or `DATA_FILE` is configured, run the command with the same environment and paths used by the server.

### Development login credentials

- Owner ID `owner` — password `owner123`
- Operators `OP-01`, `OP-02` — password `operator123`
- Drivers `T-01` through `T-10` — password `driver123`
- Customers `C-01` through `C-10` — password `customer123`

These are temporary development credentials. Change them before public deployment. Do not expose the default passwords in a public production environment.

## Added trip-management enhancements

### Smart route planner
- Open **Routes** after signing in as Owner or Operator.
- Enter an origin and destination; add up to six intermediate stops (one per line).
- Route distance and estimated driving duration are calculated with OpenStreetMap Nominatim/OSRM services. The result includes a Google Maps link for turn-by-turn navigation.
- The OSRM estimate does **not** include live traffic. Google Maps may show traffic-aware guidance when available. The public OSRM endpoint is suitable for demos/testing, not a guaranteed production SLA.

### Trip notifications
- The Overview page shows recent in-app notifications when a delivery is assigned to a vehicle or its status changes to at-risk, delayed, completed, or cancelled.
- Notifications are saved with the browser's existing RoutePilot local state. They are not push/SMS notifications; SMS still requires configuring a provider as described in the environment setup.

### Search and filters
- The Deliveries page includes filters for trip ID/customer, driver, vehicle, scheduled date, and status.
- Scheduled date is editable when adding or editing a delivery. Existing saved deliveries without a date are assigned today's date on first load.


## Flat-root layout

All project files are at the repository root. `index.html` is served directly by Express; no `public/` subfolder is required. API endpoints and the frontend are served from the same Node.js service, which is important for login, driver navigation, map data, GPS sharing, delivery proof uploads, support, and management dashboards.

Do not deploy this as a static-only Netlify site if you need the backend features. Use the included Render configuration or another Node.js host, set a strong `JWT_SECRET` and unique role passwords, and configure persistent storage for `DATA_DIR`.
