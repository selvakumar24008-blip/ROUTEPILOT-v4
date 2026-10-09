# RoutePilot maps and shipment tracking

## Driver
- Sign in as a driver and open Driver Navigation.
- Allow browser location access and select **Start navigation** to send GPS updates to the backend.
- **Navigate with Google Maps** opens Google Maps directions to the assigned delivery destination.
- If configured, Mappls can be used for the in-dashboard driver map. Configure `MAPPLS_MAP_KEY` using `.env.example`.

## Owner and operator
- Open **Overview** for the network map or **Map** for the full fleet map.
- The map shows route lines, status colours, vehicle markers, and intermediate route checkpoints.
- The shipment tracking board displays each vehicle's driver, route status, GPS freshness, and estimated progress when recent GPS coordinates are available.

## Customer
- The customer delivery map shows the routes relevant to that customer's deliveries and vehicles assigned to active deliveries.
- Customers do not see the whole fleet. Vehicle locations are available only when the assigned driver shares live GPS.

## Tracking accuracy
- Maps refresh vehicle positions and the tracking board about every 15 seconds while open.
- Browser GPS requires location permission and HTTPS in production (localhost works for development).
- Without a recent GPS update, the board shows **WAITING FOR GPS** or **GPS STALE**. A fallback map marker is approximate, not a live position.
- Progress is an estimate from the nearest point on the planned road route. It is not a guaranteed ETA or a railway-grade tracking feed.
- Maps use Leaflet, OpenStreetMap tiles, and OSRM road geometry. An internet connection is required.
