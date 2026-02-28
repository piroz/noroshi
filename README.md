# noroshi

> Raise a smoke signal on .local — mDNS service publisher GUI

**noroshi** (狼煙, "smoke signal") is a desktop application for managing and publishing mDNS (Bonjour / Avahi) services on your local network through a simple GUI.

## Features

- **Service Management** — Add, edit, delete, start, and stop mDNS services from a GUI
- **Bulk Operations** — Start or stop multiple services at once
- **TXT Records** — Attach arbitrary key-value pairs as TXT records
- **Real-time Monitoring** — View service status, timestamped log stream, and network interface info
- **Config Import / Export** — Save and load your configuration as JSON
- **Cross-platform** — macOS, Linux, and Windows

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Tauri v2](https://v2.tauri.app/) |
| Backend | Rust + [mdns-sd](https://crates.io/crates/mdns-sd) |
| Frontend | React + TypeScript |
| Styling | Tailwind CSS 4 |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/)

### Build & Run

```bash
git clone https://github.com/velocitylabo/noroshi.git
cd noroshi
npm install
npm run tauri dev
```

> **Linux:** System packages for GTK and WebKit are required.
> You may also need to set `PKG_CONFIG_PATH`:
> ```bash
> PKG_CONFIG_PATH=/usr/lib/x86_64-linux-gnu/pkgconfig:/usr/share/pkgconfig npm run tauri dev
> ```

To create a production build:

```bash
npm run tauri build
```

## Usage

1. Launch the app — the **Services** tab is shown by default
2. Click **Add Service** to register an mDNS service
   - Set a name, type (e.g. `_http._tcp`), and port
   - Optionally add TXT records
3. Toggle services **on / off** with the switch
4. Check the **Monitor** tab for real-time status and logs
5. Use the **Settings** tab to import or export your configuration

Configuration is stored at `~/.mdns-manager/config.json`.

## Configuration

```json
{
  "version": 1,
  "services": [
    {
      "name": "My Web Server",
      "type": "_http._tcp",
      "port": 8080,
      "txt": { "path": "/api", "version": "1.0" },
      "enabled": true
    }
  ]
}
```

## Architecture

```
┌─────────────────────────────────────┐
│          React Frontend             │
│  ┌───────────┬──────────┬────────┐  │
│  │ Services  │ Monitor  │Settings│  │
│  └───────────┴──────────┴────────┘  │
│          Tauri IPC (invoke)         │
├─────────────────────────────────────┤
│          Rust Backend               │
│  ┌───────────┬──────────┬────────┐  │
│  │  mDNS     │ Config   │ Host   │  │
│  │ Publisher  │ Manager  │ Info   │  │
│  └─────┬─────┴────┬─────┴───┬────┘  │
│    mdns-sd      JSON File  OS API   │
│    crate       (~/.mdns-            │
│                 manager/)           │
└─────────────────────────────────────┘
```

## Credits

Inspired by [piroz/dot-local](https://github.com/piroz/dot-local).

## License

[MIT](LICENSE)
