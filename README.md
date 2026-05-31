<div align="center">

# 🛡️ Sentinel

### Sri Lanka's Real-Time Intelligence Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Private-red)](#)

**A comprehensive, all-in-one dashboard that aggregates critical real-time data across energy, finance, news, weather, and sports for Sri Lanka — so you never miss what matters.**

</div>

---

## ✨ Features at a Glance

| Category | What You Get |
|----------|-------------|
| **⚡ Energy** | Fuel prices (Petrol 92/95, Diesel), LPG cylinder prices (Litro & Laugfs), electricity tariff calculator, load shedding status |
| **💰 Finance** | Live exchange rates with 7-day sparkline trends, interactive currency converter, fixed deposit rates from local banks |
| **📰 News & Alerts** | Real-time news feed (accidents, finance, general), traffic/road notices from RDA, water supply interruptions from NWSDB |
| **🌦️ Weather** | Current conditions for multiple cities, add custom cities, interactive district risk map with color-coded severity |
| **🏏 Sports** | Live Sri Lanka cricket scores, upcoming match schedule with format tags (TEST/ODI/T20) |
| **🔔 Notifications** | Web Push notifications via service worker — stay updated even when the tab is closed |

---

## 🗂️ Dashboard Tabs

The dashboard is organized into **6 purpose-driven tabs**:

```
┌──────────────────────────────────────────────────────────────┐
│  Overview  │  Energy  │  Finance  │  News  │  Weather  │ Sports │
└──────────────────────────────────────────────────────────────┘
```

- **Overview** — At-a-glance summary: health alerts, disaster warnings, fuel prices, forex rates, and weather
- **Energy** — Fuel price trends with historical charts, LPG tracker, electricity bill calculator, load shedding status
- **Finance** — Exchange rate table with sparklines, currency converter (cross-rate support), FD interest rate comparison
- **News** — Categorized news feed, traffic advisories from RDA, water supply notices from NWSDB
- **Weather** — Multi-city weather cards, searchable city selector, interactive SVG risk map by district
- **Sports** — Live cricket match scores with batting highlights, upcoming fixtures linked to ESPNcricinfo

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, ISR every 15 min) |
| UI | [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) |
| Charts | [Recharts](https://recharts.org/) + custom sparkline component |
| Notifications | Web Push API + Service Worker |
| Theming | Dark / Light mode via `next-themes` |
| Icons | [Lucide React](https://lucide.dev/) |
| Language | TypeScript 5 |

---

## 📊 Data Sources

| Data | Source |
|------|--------|
| Fuel prices | Ceypetco |
| LPG prices | Litro Gas / Laugfs Gas |
| Electricity tariffs | CEB (Ceylon Electricity Board) |
| Exchange rates | Central Bank of Sri Lanka |
| FD rates | Local commercial banks |
| News | Aggregated feeds |
| Traffic notices | RDA (Road Development Authority) |
| Water notices | NWSDB (National Water Supply & Drainage Board) |
| Health alerts | Ministry of Health — Epidemiology Unit |
| Weather | [Open-Meteo API](https://open-meteo.com/) |
| Disaster alerts | DMC (Disaster Management Centre) |
| Cricket | [ESPNcricinfo](https://www.espncricinfo.com/) |
| Holidays | Official public holiday calendar |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm**, **yarn**, **pnpm**, or **bun**

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/Sentinel.git
cd Sentinel

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create optimized production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint checks |

---

## 📁 Project Structure

```
Sentinel/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main dashboard (SSR + ISR)
│   └── api/
│       ├── notify/         # POST — send push notifications
│       └── subscribe/      # POST/DELETE — manage subscriptions
├── components/
│   ├── dashboard-shell.tsx # Tabbed layout shell
│   ├── fuel-tracker.tsx    # Fuel price cards + chart
│   ├── exchange-rates.tsx  # Forex table + sparklines
│   ├── weather-widget.tsx  # Multi-city weather
│   ├── risk-map.tsx        # Interactive SVG district map
│   ├── cricket-widget.tsx  # Live cricket scores
│   ├── notification-bell.tsx # Push notification toggle
│   └── ui/                 # shadcn/ui primitives
├── lib/
│   ├── api/                # Server-side data fetchers
│   ├── i18n/               # Internationalization
│   └── utils.ts            # Shared utilities
├── data/                   # Static/seed JSON data
└── public/
    └── sw.js               # Service worker for push
```

---

## 🔔 Push Notifications

Sentinel supports **Web Push Notifications** so you can receive alerts even when the browser tab is closed.

1. Click the **bell icon** in the navbar to enable notifications
2. Grant browser permission when prompted
3. Receive real-time alerts for disasters, health advisories, and more

The service worker (`sw.js`) handles background push events and notification click routing.

---

## 🌙 Theming

Toggle between **Light** and **Dark** modes using the theme switch in the navbar. The preference is persisted across sessions.

---

## 📄 License

This is a private project. All rights reserved.

---

<div align="center">
  <sub>Built with ❤️ for Sri Lanka</sub>
</div>
