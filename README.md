# FlytBase Security Ops: Drone Alert Management System

Independent concept based on FlytBase's design assignment. Not an official FlytBase product.

This is a concept for a FlytBase product design assignment. It imagines a command center where security operators manage drones, alerts, patrols and incidents for a fictional museum, the Musée d'Art Précieux.

- Live demo: https://subhcool238.github.io/Drone-Alert-Management-System/
- Case study: https://www.shubh.design/case-study/flytbase

## Features

- **Dashboard:** live alert cards with a ticking SLA countdown, severity and threat filters, priority badges (P1 to P4), a multi-incident banner, a pause-patrols switch while a P1 alert is open, fleet status counters, a readiness overview, a simulated 2D and 3D map view, and a shift handover briefing that must be acknowledged.
- **Fleet Management:** searchable drone list with status and health filters, a detail view with health score, service countdown, anomaly flags and telemetry cards, and a maintenance scheduling popup.
- **Manual Control:** drone selector, a 5-minute session timer with warnings at 2:00 and 4:00 elapsed, automatic return to autonomy at the limit, extension requests (+2 minutes, up to 3), and a session ended popup.
- **Patrol Routes:** route library with search, scope filter and a coverage gap filter, route details with schedule and assignments, a night operation notice, and a rule-based recommendation that can be applied to assign a drone.
- **Incidents:** incident table with filters, summary strip, a detail panel with timeline and evidence, analytics charts, and a report center.
- **Settings:** roles and permissions table, alert rules and SLA tiers, integrations, notification channels, and language and region.
- **Header:** a rule-based system summary built from the sample data, a notifications menu, and the shift briefing.

## Tech

React, TypeScript, Vite, Tailwind CSS, Recharts and React Router.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000/Drone-Alert-Management-System/

## Accessibility

The app is built toward WCAG 2.2 AA targets. It has been checked with axe-core (zero violations on every page and dialog state at 1440x900), a keyboard-only pass with the Tab key on every page, and the contrast script in `scripts/contrast-check.mjs`. It has not had an audit by assistive technology users or a full manual review, so it makes no conformance claim.

What is in place: a skip link, visible focus on every control, keyboard operation for cards and rows, dialogs that trap focus and return it, Escape to close (except the first-load shift handover briefing, which needs its checkbox and Acknowledge), labels on every field and icon button, state announcements for incidents, SLA changes and the Manual Control timer (the ticking values themselves are not announced), text summaries and hidden data tables for the charts, reduced-motion support, and a self-hosted icon font.

Known limits:

- Not tested with a real screen reader (NVDA, JAWS or VoiceOver); the semantics are checked by tools only.
- The sample data is static, so a new incident arriving live is not exercised; that announcement path is wired but only SLA state changes occur in the demo.
- The Settings roles table scrolls sideways below about 1366px wide.
- The Tailwind script still loads from a CDN, and sample images and the avatar load from external hosts.
- The Dashboard 2D map is a drawing without a text equivalent beyond its alert markers.
- Only the layouts at 1280x720, 1366x768, 1440x900 and 1920x1080 were checked; there is no mobile layout.

## Deploy

```bash
npm run deploy
```

This builds the app and publishes the `dist` folder to the `gh-pages` branch.

## About the data

All alerts, drones, confidence scores and incidents are simulated sample data. Nothing is connected to real systems.

Built with AI coding tools.
