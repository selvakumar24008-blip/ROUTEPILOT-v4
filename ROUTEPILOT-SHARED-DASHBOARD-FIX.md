# RoutePilot shared dashboard fix

This version fixes the blank driver dashboard caused by a helper function being scoped inside an extension script. It also adds shared driver problem reports and an operator decision queue.

## What changed

- Driver dashboard can render the nearby-trader panel safely.
- Driver dashboard fetches assigned vehicle, deliveries, routes, and its own problem reports from the server.
- Drivers can submit a problem with a route and description to the shared backend.
- The server marks active deliveries on the affected route as `AT_RISK` and includes the affected delivery IDs and priority counts in the report.
- Owner/operator dashboards have a **Driver Problem Reports** page with the reported type, route, driver, time, impact summary, affected deliveries, and actions for a reroute plan, driver reassignment plan, delay/customer-notification plan, escalation, dismissal, or resolution.
- Decisions and instructions are stored server-side and shown back on the driver's dashboard.
- Owner/operator state sync preserves server problem reports and active problem-related risk statuses.

## Deploy the fix

1. Download and extract this ZIP. Keep `server.js`, `index.html`, `package.json`, `render.yaml`, and the other root files together.
2. Commit the updated files to the same GitHub repository connected to your Render web service.
3. In Render, keep `JWT_SECRET` set to a private random value of at least 32 characters. Do not put it in GitHub or send it in chat.
4. Deploy the latest commit and wait for the service to become **Live**.
5. Sign out of RoutePilot, then sign in again so the browser receives a fresh server session. The shared report features require successful server login.
6. Open **Driver Problem Reports** from the owner or operator navigation. Submit a test report from the driver account and confirm it appears in the queue. Record a decision with instructions, then refresh the driver dashboard to see the decision.

## Notes

- The backend uses a JSON data file under `DATA_DIR` (Render configuration uses `/var/data`). A persistent disk is needed if the data must survive restarts/redeploys.
- The existing browser-local demo data and existing server data are separate until a successful server login loads the server snapshot. The server snapshot becomes the shared source for owner/operator management screens.
- A driver photo preview is not uploaded by the new problem-report endpoint; the report currently shares the typed description, type, route, and driver identity. Delivery proof photos continue to use the separate delivery-proof endpoint.
- Decision buttons record the operator's selected plan and instructions. They do not automatically notify a customer by SMS; SMS needs a configured provider and credentials.
