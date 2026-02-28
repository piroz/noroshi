# noroshi

> Raise a smoke signal on .local — mDNS service publisher GUI

**noroshi**（狼煙）は、ローカルネットワーク上で mDNS（Bonjour / Avahi）サービスを GUI で簡単に管理・公開できるデスクトップアプリケーションです。

<!-- スクリーンショットを追加する場合:
![noroshi screenshot](docs/screenshot.png)
-->

## Features

- **サービス管理** — mDNS サービスの追加・編集・削除・開始・停止を GUI で操作
- **一括操作** — 複数サービスの一括開始・停止
- **TXT レコード** — 任意の key-value ペアを TXT レコードとして設定可能
- **リアルタイムモニタリング** — サービスステータス、タイムスタンプ付きログストリーム、ネットワークインターフェース情報の表示
- **設定のインポート / エクスポート** — JSON 形式で設定を書き出し・読み込み
- **クロスプラットフォーム** — macOS / Linux / Windows 対応

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Tauri v2](https://v2.tauri.app/) |
| Backend | Rust + [mdns-sd](https://crates.io/crates/mdns-sd) |
| Frontend | React + TypeScript |
| Styling | Tailwind CSS 4 |

## Install

### Pre-built Binaries

[Releases](../../releases) ページからお使いの OS に合ったバイナリをダウンロードしてください。

### Build from Source

#### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/)

#### Steps

```bash
# Clone the repository
git clone https://github.com/velocitylabo/noroshi.git
cd noroshi

# Install frontend dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

> **Note (Linux):** システム依存パッケージ（GTK, WebKit）が必要です。
> cargo / tauri コマンドには環境変数の設定が必要な場合があります:
> ```bash
> PKG_CONFIG_PATH=/usr/lib/x86_64-linux-gnu/pkgconfig:/usr/share/pkgconfig npm run tauri dev
> ```

## Usage

1. アプリを起動すると **Services** タブが表示されます
2. 「**Add Service**」ボタンから mDNS サービスを登録します
   - サービス名、タイプ（例: `_http._tcp`）、ポート番号を設定
   - 必要に応じて TXT レコードを追加
3. トグルスイッチでサービスを **開始 / 停止**
4. **Monitor** タブでリアルタイムのステータスとログを確認
5. **Settings** タブで設定のインポート / エクスポート

設定ファイルは `~/.mdns-manager/config.json` に保存されます。

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
