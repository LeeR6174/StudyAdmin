# StudyAdmin - Personal Productivity Hub

StudyAdminは、日々の情報の「即時記録（Inbox）」や2週間に1回の「Role Lettering」などを統合した、ミニマルでプレミアムなパーソナル・プロダクティビティ・ツールです。

## ✨ 主な機能

1. **Quick Inbox (即時記録)**
   *   思いついたタスクやアイデアを、期限や場所と共に一瞬で記録。
   *   Notion DBと同期し、デスクトップからも管理可能。
2. **Role Lettering**
   *   2週間に1回（毎週水曜日実施）、自分自身と向き合い次の自分へ手紙を送る振り返り機能。
3. **Cool & Gentle UI**
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
   NOTION_ROLE_LETTERING_DB_ID=letters_database_id
   ```

2. **開発サーバーの起動**
   ```bash
   npm install
   npm run dev
   ```

---
*Developed for deeper thinking and faster action.*
