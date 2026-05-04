# StudyAdmin - Self Coaching Hub

StudyAdminは、自身を生徒とコーチの2つの視点から管理・育成するための、モバイルファーストな「セルフコーチング・ハブ」アプリケーションです。Next.js と Notion API を連携し、思考の整理と日々のタスク実行を強力にサポートします。

## ✨ 主な機能

1. **生徒モード（Desk）**
   *   直感的なスワイプ操作（Framer Motion）によるタスク完了
   *   「未着手」「完了」のタブ切り替えと「実行中」のフォーカスUI
2. **先生モード（Coach Desk）**
   *   パスワード保護（デフォルト `555`）によるモード切り替え
   *   大目標（プロジェクト）の管理とタスクへの細分化（未アサイン・プール機能）
   *   生徒へのタスク・アサイン（宿題機能）
3. **コーチング・ループと壁打ち（Log）**
   *   「KPT法」「失敗分析」などの穴埋め式フレームワークを備えた思考の書き出し
   *   Notionデータベースへの自動Markdownフォーマット保存
   *   先生モードで昨日のログを確認し、次の宿題へ繋げるコーチング・ループ
4. **PWA対応とプレミアムUI**
   *   ダークモード基調のグラスモーフィズムデザイン
   *   ユーザーアクションに対するグローバル・トースト通知

## 🛠 技術スタック

*   **Framework**: Next.js (App Router)
*   **Styling**: Vanilla CSS (CSS Modules)
*   **Animation**: Framer Motion
*   **Icons**: Lucide React
*   **Backend / DB**: Notion API (`@notionhq/client`)

## 🚀 セットアップ手順

1. **リポジトリのクローンとインストール**
   ```bash
   git clone https://github.com/LeeR6174/StudyAdmin.git
   cd StudyAdmin
   npm install
   ```

2. **環境変数の設定**
   ルートディレクトリにある `.env.local.example` をコピーして `.env.local` を作成し、Notion APIのキーとデータベースIDを設定してください。
   ```env
   NOTION_API_KEY=ntn_your_secret_token_here
   NOTION_TASKS_DB_ID=your_tasks_database_id_here
   NOTION_LOGS_DB_ID=your_logs_database_id_here
   ```

3. **Notionデータベースの準備**
   *   **Tasks DB**: `Name` (タイトル), `Status` (セレクト: `未アサイン`, `未着手`, `完了`), `Project` (テキスト)
   *   **Logs DB**: `Name` (タイトル), `Type` (セレクト: `壁打ち`, `コーチメモ`), `Date` (日付)

4. **開発サーバーの起動**
   ```bash
   npm run dev
   ```
   ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認できます。

## 📱 PWAとしての利用

スマホのブラウザでアクセスし、「ホーム画面に追加」を選択することで、ネイティブアプリのようにフルスクリーンで快適に利用できます。

---
*Developed for personal growth and self-management.*
