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
```

**Important:** On Linux, `PKG_CONFIG_PATH=/usr/lib/x86_64-linux-gnu/pkgconfig:/usr/share/pkgconfig` is required for all cargo/tauri commands due to GTK/WebKit system dependencies.

## Architecture

Tauri v2 desktop app: Rust backend communicates with React frontend via IPC (`invoke`).

### Backend (`src-tauri/src/`)

- **lib.rs** — App entry point. Loads config, creates `ServiceDaemon`, auto-starts enabled services, registers all Tauri commands.
- **models.rs** — Data types: `AppConfig`, `ServiceConfig` (persisted), `ServiceStatus` (runtime enum), `ServiceView` (sent to frontend, combines config + status). `ServiceConfig.service_type` is serialized as `"type"` via `#[serde(rename)]`.
- **state.rs** — `AppState` holds three `Mutex`-wrapped fields: config, daemon, and status map. Each mutex is locked/released in small scoped blocks to avoid deadlocks.
- **commands.rs** — 8 Tauri commands. Every mutating command returns the full `Vec<ServiceView>` so the frontend can replace its state entirely (response-based, not optimistic).
- **config.rs** — Reads/writes `~/.mdns-manager/config.json`. Uses atomic writes (write to `.tmp`, then rename). Hostname is always refreshed from OS on load, not persisted.
- **mdns.rs** — Wraps `mdns-sd` crate. Converts user-facing service types (e.g. `_http._tcp`) to mDNS format (`_http._tcp.local.`). The `ServiceDaemon` is long-lived (one per app lifetime).
- **error.rs** — `AppError` uses `thiserror` for Display and implements `Serialize` manually (serializes as the error string).

### Frontend (`src/`)

- **lib/commands.ts** — Typed `invoke` wrappers. Tauri auto-converts `camelCase` params to Rust `snake_case`, so the JS side uses `serviceType` while Rust receives `service_type`.
- **hooks/useServices.ts** — Single hook managing all service state. Every operation calls a command, then replaces local state with the returned array.
- **components/** — `App` orchestrates form dialog state. `Layout` fetches and displays hostname. `ServiceTable` > `ServiceRow` for the list. `ServiceFormDialog` + `TxtRecordEditor` for add/edit. `BulkActions` for Start All / Stop All.
- **Styling** — Tailwind CSS 4 via `@tailwindcss/vite` plugin (no PostCSS config). Entry point is `src/index.css` with `@import "tailwindcss"`.

### Key Design Decisions

- Services are identified by UUID (`id` field), generated server-side on add.
- The Cargo lib name is `mdns_manager_lib` (referenced in `main.rs`).
- Config file version field exists for future schema migration but is currently always `1`.

## Spec

See `mdns-manager-spec.md` for the full design spec. Phase 1 (core service management) is implemented. Phases 2 (monitoring) and 3 (settings/polish) are not yet started.
