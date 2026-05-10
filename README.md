# StudyAdmin - Personal Productivity Hub

StudyAdminは、日々の情報の「即時記録（Inbox）」、自分との「対話練習（Practice）」、そしてコンテンツの「深層思考（Thinking）」を統合した、ミニマルでプレミアムなパーソナル・プロダクティビティ・ツールです。

## ✨ 主な機能

1. **Quick Inbox (即時記録)**
   *   思いついたタスクやアイデアを、期限や場所と共に一瞬で記録。
   *   Notion DBと同期し、デスクトップからも管理可能。
2. **Conversation Practice (会話練習)**
   *   一人二役でのチャットシミュレーション。
   *   終了後の「反省コメント」と共に履歴を保存し、客観的に自分を振り返る。
3. **Thinking Notes (思考ノート)**
   *   「比較」「抽象」「ナイモノ」「流行」「普遍」の5つのカテゴリで、コンテンツを深掘り。
   *   フレームワークに基づいた質の高い思考記録。
4. **Cool & Gentle UI**
   *   Slate & Teal を基調とした落ち着いたデザイン。
   *   グラスモーフィズムとスムーズなアニメーションによるプレミアムな操作感。

## 🛠 技術スタック

*   **Framework**: Next.js (App Router)
*   **Styling**: Vanilla CSS (CSS Modules)
*   **Animation**: Framer Motion
*   **Icons**: Lucide React
*   **Backend / DB**: Notion API

## 🚀 セットアップ手順

1. **環境変数の設定**
   `.env.local` に以下のキーを設定してください：
   ```env
   NOTION_API_KEY=your_notion_api_key
   NOTION_INBOX_DB_ID=inbox_database_id
   NOTION_LOGS_DB_ID=logs_database_id (練習記録用)
   NOTION_NOTES_DB_ID=notes_database_id (思考ノート用)
   ```

2. **開発サーバーの起動**
   ```bash
   npm install
   npm run dev
   ```

---
*Developed for deeper thinking and faster action.*
