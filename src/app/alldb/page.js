"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import { Database, Plus, Loader2, CheckSquare, Square, RefreshCw } from "lucide-react";
import { useAppContext } from "@/context/AppProvider";

export default function AllDbPage() {
  const { showToast, isTestMode, setAllDbTaskCount } = useAppContext();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("タスク");

  // Form states
  const [name, setName] = useState("");
  const [tag, setTag] = useState("タスク");
  const [reflection, setReflection] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]); // Default to today

  const fetchItems = async () => {
    setIsLoading(true);
    if (isTestMode) {
      const dummy = [
        { id: "test1", name: "Notion連携の新機能", tag: "アイデア", reflection: "グラフ表示機能を追加したら面白そう", date: new Date().toISOString().split("T")[0], isCompleted: false },
        { id: "test2", name: "バグ修正: アニメーション", tag: "タスク", reflection: "完了時のフェードアウトを直す", date: new Date().toISOString().split("T")[0], isCompleted: false },
        { id: "test3", name: "買い物リスト", tag: "メモ", reflection: "牛乳、卵、コーヒー豆", date: new Date(Date.now() - 86400000).toISOString().split("T")[0], isCompleted: false },
        { id: "test4", name: "読書: Clean Code", tag: "タスク", reflection: "3章まで読んで要点をまとめる", date: new Date().toISOString().split("T")[0], isCompleted: false },
        { id: "test5", name: "ブログのネタ", tag: "アイデア", reflection: "Next.js 14のApp Routerについて書く", date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0], isCompleted: false },
      ];
      setItems(dummy);
      setAllDbTaskCount(dummy.filter(i => i.tag === "タスク").length);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/alldb");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        setAllDbTaskCount(data.filter(i => i.tag === "タスク").length);
      }
    } catch (error) {
      console.error("Fetch error", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    
    if (isTestMode) {
      const created = { id: Date.now().toString(), name, tag, reflection, date, isCompleted: false };
      setName("");
      setReflection("");
      setItems((prev) => [created, ...prev]);
      if (tag === "タスク") setAllDbTaskCount(prev => prev + 1);
      showToast("テストデータを作成しました！");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = { name, tag, reflection, date };
      const res = await fetch("/api/alldb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        setName("");
        setReflection("");
        setItems((prev) => [created, ...prev]);
        if (tag === "タスク") setAllDbTaskCount(prev => prev + 1);
        showToast("データを作成しました！");
      }
    } catch (error) {
      console.error("Submit error", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async (id) => {
    // Optimistic update: remove from the uncompleted list
    const itemToComplete = items.find(i => i.id === id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (itemToComplete?.tag === "タスク") {
      setAllDbTaskCount(prev => prev > 0 ? prev - 1 : 0);
    }
    showToast("完了にしました！");
    if (isTestMode) return;
    try {
      await fetch("/api/alldb", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isCompleted: true }),
      });
    } catch (error) {
      console.error("Failed to complete task", error);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>ALL DB</h1>
          <p className={styles.subtitle}>すべてのデータを集約</p>
        </div>
        <button className={styles.iconBtn} onClick={fetchItems} disabled={isLoading}>
          <RefreshCw size={24} className={isLoading ? styles.spin : ""} />
        </button>
      </header>

      <div className={`${styles.content} no-scrollbar`}>
        {/* Entry Form */}
        <section className={styles.section} style={{ marginBottom: "24px" }}>
          <h2 className={styles.sectionTitle}><Database size={18} /> 新規追加</h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px", display: "block" }}>名前 (Title)</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="タスク名やアイデア..." 
                className={styles.input} 
                required 
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px", display: "block" }}>タグ</label>
                <select 
                  value={tag} 
                  onChange={(e) => setTag(e.target.value)} 
                  className={styles.input}
                >
                  <option value="タスク">タスク</option>
                  <option value="メモ">メモ</option>
                  <option value="アイデア">アイデア</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px", display: "block" }}>日付 (Date)</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className={styles.input} 
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px", display: "block" }}>要件 / 詳細メモ</label>
              <textarea 
                value={reflection} 
                onChange={(e) => setReflection(e.target.value)} 
                placeholder="タスクの具体的な要件や、メモしておきたいことを記入..." 
                className={styles.input}
                style={{ minHeight: "80px", resize: "vertical" }}
              />
            </div>

            <button type="submit" className={styles.primaryBtn} disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? <Loader2 size={18} className={styles.spin} /> : <Plus size={18} />}
              追加する
            </button>
          </form>
        </section>

        {/* Task List */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: "16px" }}>未完了のデータ</h2>
          <div className={styles.content}>
        <div className={styles.tabs} style={{ marginBottom: "16px" }}>
          <button className={`${styles.tab} ${activeTab === "タスク" ? styles.activeTab : ""}`} onClick={() => setActiveTab("タスク")}>
            タスク
          </button>
          <button className={`${styles.tab} ${activeTab === "アイデア" ? styles.activeTab : ""}`} onClick={() => setActiveTab("アイデア")}>
            アイデア
          </button>
          <button className={`${styles.tab} ${activeTab === "メモ" ? styles.activeTab : ""}`} onClick={() => setActiveTab("メモ")}>
            メモ
          </button>
        </div>

        <div className={styles.list}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <Loader2 className={styles.spin} size={24} />
              <p>データを取得中...</p>
            </div>
          ) : items.filter(i => i.tag === activeTab).length === 0 ? (
            <div className={styles.emptyState}>
              <Database size={48} className={styles.emptyIcon} />
              <p>未完了の{activeTab}はありません。</p>
            </div>
          ) : (
            items.filter(i => i.tag === activeTab).map((item) => (
              <div key={item.id} className={styles.studentTaskCard} style={{ flexDirection: "column", alignItems: "flex-start", gap: "12px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--accent-primary)", marginBottom: "4px", fontWeight: 600 }}>{item.date}</div>
                    <div style={{ fontSize: "1rem", fontWeight: 500 }}>{item.name}</div>
                  </div>
                  <button 
                    onClick={() => handleComplete(item.id)} 
                    className={styles.checkboxBtn}
                    aria-label="完了にする"
                  ></button>
                </div>
                {item.reflection && (
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", backgroundColor: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "8px", width: "100%", marginTop: "12px", border: "1px solid var(--border-color)" }}>
                    {item.reflection}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
        </section>
      </div>
    </div>
  );
}
