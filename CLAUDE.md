# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Run the full Tauri app (frontend + backend) in dev mode
PKG_CONFIG_PATH=/usr/lib/x86_64-linux-gnu/pkgconfig:/usr/share/pkgconfig npm run tauri dev

# Type-check frontend only
npx tsc --noEmit

# Build frontend only
npx vite build

# Check Rust backend only
cd src-tauri && PKG_CONFIG_PATH=/usr/lib/x86_64-linux-gnu/pkgconfig:/usr/share/pkgconfig cargo check

# Install frontend dependencies
npm install

# Lint frontend (ESLint)
npx eslint src/

# Format frontend (Prettier)
npx prettier --write 'src/**/*.{ts,tsx}'

# Format Rust backend
cd src-tauri && cargo fmt
```

**Important:** On Linux, `PKG_CONFIG_PATH=/usr/lib/x86_64-linux-gnu/pkgconfig:/usr/share/pkgconfig` is required for all cargo/tauri commands due to GTK/WebKit system dependencies.

## Architecture

Tauri v2 desktop app: Rust backend communicates with React frontend via IPC (`invoke`) and real-time events (`Emitter` / `listen`).

### Backend (`src-tauri/src/`)

- **lib.rs** — App entry point. Loads config, creates `ServiceDaemon`, auto-starts enabled services, registers all Tauri commands. Uses `setup()` to log app startup.
- **models.rs** — Data types: `AppConfig`, `ServiceConfig` (persisted), `ServiceStatus` (runtime enum), `ServiceView` (sent to frontend, combines config + status), `LogEntry`/`LogLevel` (monitoring), `NetworkInterface`. `ServiceConfig.service_type` is serialized as `"type"` via `#[serde(rename)]`.
- **state.rs** — `AppState` holds four `Mutex`-wrapped fields: config, daemon, status map, and logs (`VecDeque<LogEntry>`). Each mutex is locked/released in small scoped blocks to avoid deadlocks.
- **commands.rs** — 11 Tauri commands. Every mutating command takes `AppHandle`, logs via `logging::append_log()`, emits `services-changed` event, and returns full `Vec<ServiceView>` so the frontend can replace its state entirely (response-based, not optimistic).
- **config.rs** — Reads/writes `~/.mdns-manager/config.json`. Uses atomic writes (write to `.tmp`, then rename). Hostname is always refreshed from OS on load, not persisted.
- **mdns.rs** — Wraps `mdns-sd` crate. Converts user-facing service types (e.g. `_http._tcp`) to mDNS format (`_http._tcp.local.`). The `ServiceDaemon` is long-lived (one per app lifetime). `ServiceInfo` must call `.enable_addr_auto()` — without it, addresses are empty and the service is not advertised on the network.
- **logging.rs** — `append_log()` adds to in-memory `VecDeque` (max 500 entries) and emits `log-entry` Tauri event.
- **network.rs** — `get_interfaces()` uses `if-addrs` crate, excludes loopback, groups addresses by interface name.
- **error.rs** — `AppError` uses `thiserror` for Display and implements `Serialize` manually (serializes as the error string).

### Frontend (`src/`)

- **lib/commands.ts** — Typed `invoke` wrappers. Tauri auto-converts `camelCase` params to Rust `snake_case`, so the JS side uses `serviceType` while Rust receives `service_type`.
- **hooks/useServices.ts** — Service state management. Every operation calls a command, then replaces local state with the returned array. Also listens to `services-changed` events for cross-tab state sync.
- **hooks/useMonitoring.ts** — Monitoring state: logs (with level filter), network interfaces. Listens to `log-entry` events for real-time log streaming.
- **components/** — `App` manages tab state (Services/Monitor) and form dialog. `Layout` renders header with tab navigation and hostname. Services tab: `ServiceTable` > `ServiceRow`, `ServiceFormDialog` + `TxtRecordEditor`, `BulkActions`. Monitor tab: `MonitoringView` > `StatusDashboard` + `LogViewer` + `NetworkInfo`.
- **Styling** — Tailwind CSS 4 via `@tailwindcss/vite` plugin (no PostCSS config). Entry point is `src/index.css` with `@import "tailwindcss"`.

### Real-time Event Flow

Backend emits two Tauri events:
- `services-changed` (payload: `Vec<ServiceView>`) — emitted after every mutating command so the frontend stays in sync regardless of which tab is active.
- `log-entry` (payload: `LogEntry`) — emitted on every log append for real-time log streaming to the Monitor tab.

### Key Design Decisions

- Services are identified by UUID (`id` field), generated server-side on add.
- The Cargo lib name is `mdns_manager_lib` (referenced in `main.rs`).
- Config file version field exists for future schema migration but is currently always `1`.
- Logs are in-memory only (not persisted), capped at 500 entries via `VecDeque`.

## Spec

See `mdns-manager-spec.md` for the full design spec. Phases 1 (core service management) and 2 (monitoring) are implemented. Phase 3 (settings/polish) is not yet started.
