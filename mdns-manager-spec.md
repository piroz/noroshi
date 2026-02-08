# mdns-manager — mDNS サービス広告管理ツール 設計仕様書

## 概要

mDNS（Bonjour/Avahi）のサービス広告（publish）をGUIで簡単に管理できるデスクトップアプリケーション。

## 対象ユーザー

- 開発者向け
- ローカル開発環境でサービスを `.local` ドメインで公開したいユースケース

## 技術スタック

| 領域 | 技術 | 選定理由 |
|---|---|---|
| フレームワーク | **Tauri v2** | 軽量（5-10MB）、Rustバックエンドで安全なOS操作、マルチOS対応 |
| フロントエンド | **React + TypeScript** | 開発者に馴染みのあるスタック |
| スタイリング | **Tailwind CSS** | 素早いUI構築 |
| mDNSライブラリ | **`mdns-sd` Rustクレート** | 純Rust実装、外部依存なし、OS抽象化 |
| 設定ファイル | **JSON** | |

## 対象OS

- macOS
- Linux
- Windows

## アーキテクチャ

```
┌─────────────────────────────────────┐
│          React Frontend             │
│  ┌───────────┬──────────┬────────┐  │
│  │ サービス   │ モニター  │ 設定   │  │
│  │ 管理画面   │ 画面     │ 画面   │  │
│  └───────────┴──────────┴────────┘  │
│          Tauri IPC (invoke)         │
├─────────────────────────────────────┤
│          Rust Backend               │
│  ┌───────────┬──────────┬────────┐  │
│  │ mDNS      │ Config   │ Host   │  │
│  │ Publisher  │ Manager  │ Info   │  │
│  └─────┬─────┴────┬─────┴───┬────┘  │
│        │          │         │        │
│   mdns-sd      JSON File  OS API    │
│   crate       (~/.mdns-  (読取専用) │
│               manager/)              │
└─────────────────────────────────────┘
```

## 機能一覧

### サービス広告管理（メイン機能）

- サービスの追加・編集・削除
- サービス一覧テーブル表示（名前 / タイプ / ポート / TXTレコード / ステータス）
- 個別の開始/停止トグル
- 一括開始/停止

### リアルタイムモニター

- 広告中サービスのステータス表示（稼働中 / 停止 / エラー）
- タイムスタンプ付きログストリーム
- ネットワークインターフェース情報

### 設定管理

- JSON形式での設定インポート/エクスポート
- ホスト名の表示（読み取り専用）+ OS別変更方法のツールチップ
- アプリ設定（起動時の挙動など）

### 対象外（スコープ外）

- ホスト名の変更UI（頻度が低く、OS標準手段で十分なため除外）
- サービス発見（browse）機能
- OS起動時の自動有効化

## 画面構成

### ① サービス管理画面（メイン）

- サービス一覧テーブル
- 追加・編集・削除ボタン
- 個別の開始/停止トグル
- 一括開始/停止ボタン

### ② リアルタイムモニター画面

- サービスステータスダッシュボード
- ログストリーム（タイムスタンプ付き）
- ネットワークインターフェース情報

### ③ 設定画面

- ホスト名表示（読み取り専用）+ 変更方法ヘルプ
- JSON設定のインポート/エクスポートボタン
- アプリ設定

## 設定ファイル仕様

パス: `~/.mdns-manager/config.json`

```json
{
  "version": 1,
  "hostname": "my-dev-machine",
  "services": [
    {
      "name": "My Web Server",
      "type": "_http._tcp",
      "port": 8080,
      "txt": { "path": "/api", "version": "1.0" },
      "enabled": true
    },
    {
      "name": "My SSH",
      "type": "_ssh._tcp",
      "port": 22,
      "txt": {},
      "enabled": false
    }
  ]
}
```

### フィールド定義

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `version` | number | ✅ | 設定ファイルのスキーマバージョン |
| `hostname` | string | ❌ | 現在のホスト名（読み取り専用、アプリ起動時にOSから取得） |
| `services` | array | ✅ | サービス定義の配列 |
| `services[].name` | string | ✅ | サービスの表示名 |
| `services[].type` | string | ✅ | サービスタイプ（例: `_http._tcp`） |
| `services[].port` | number | ✅ | ポート番号 |
| `services[].txt` | object | ❌ | TXTレコード（key-valueペア） |
| `services[].enabled` | boolean | ✅ | 有効/無効フラグ |

## マルチOS対応方針

| 機能 | macOS | Linux | Windows |
|---|---|---|---|
| サービス広告 | `mdns-sd` crate | `mdns-sd` crate | `mdns-sd` crate |
| ホスト名取得 | `scutil --get LocalHostName` | `hostname` | `hostname` |
| 依存関係 | なし（標準搭載） | なし（純Rust実装） | なし（純Rust実装） |

`mdns-sd` クレートが純Rust実装のため、OS固有のmDNSデーモン（Bonjour/Avahi）への依存を回避できる。

## 開発フェーズ

### Phase 1: コア機能

- サービス管理画面UI
- JSON設定ファイルの読み書き
- サービスのpublish/停止（`mdns-sd` クレート経由）

### Phase 2: モニタリング

- リアルタイムモニター画面
- ログストリーム表示
- サービスステータスのリアルタイム更新

### Phase 3: 設定・仕上げ

- インポート/エクスポートUI
- ホスト名の読み取り専用表示 + 変更方法ツールチップ
- マルチOSテスト・調整
- パッケージング（各OS向けインストーラー）

## 参考

- 元リポジトリ: [piroz/dot-local](https://github.com/piroz/dot-local)（Electron製、アーカイブ済み）
- [mdns-sd crate](https://crates.io/crates/mdns-sd)
- [Tauri v2 ドキュメント](https://v2.tauri.app/)
