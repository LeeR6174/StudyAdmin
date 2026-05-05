"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import { Database, Plus, Loader2, CheckSquare, Square, RefreshCw } from "lucide-react";
import { useAppContext } from "@/context/AppProvider";

export default function AllDbPage() {
  const { showToast, isTestMode } = useAppContext();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [tag, setTag] = useState("タスク");
  const [reflection, setReflection] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]); // Default to today

  const fetchItems = async () => {
    setIsLoading(true);
    if (isTestMode) {
      setItems([
        { id: "test1", name: "新しいアプリのアイデア", tag: "アイデア", reflection: "AIを使った学習サポート機能があれば良さそう", date: new Date().toISOString().split("T")[0], isCompleted: false },
        { id: "test2", name: "今日の復習", tag: "タスク", reflection: "数学の公式を確認する", date: new Date().toISOString().split("T")[0], isCompleted: false },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/alldb");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
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
      if (tag === "タスク") setItems((prev) => [created, ...prev]);
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
        // UI updates
        setName("");
        setReflection("");
        
        // Only append to UI if it matches the current filter (it's a task and not completed)
        // Since we force it to be uncompleted on create, we just check tag.
        if (tag === "タスク") {
          setItems((prev) => [created, ...prev]);
        }
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
    setItems((prev) => prev.filter((item) => item.id !== id));
    showToast("タスクを完了にしました！");
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
              <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px", display: "block" }}>振り返り (Reflection)</label>
              <textarea 
                value={reflection} 
                onChange={(e) => setReflection(e.target.value)} 
                placeholder="詳細や振り返りを記入..." 
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
          <h2 className={styles.sectionTitle} style={{ marginBottom: "16px" }}>未完了のタスク</h2>
          
          {isLoading && items.length === 0 ? (
            <div className={styles.loadingContainer}>
              <Loader2 size={32} className={styles.spin} />
              <p>取得中...</p>
            </div>
          ) : items.length > 0 ? (
            <div className={styles.teacherTaskList} style={{ gap: "12px" }}>
              {items.map((item) => (
                <div key={item.id} className={styles.teacherTaskCard} style={{ flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#c084fc", marginBottom: "4px", fontWeight: 600 }}>{item.date}</div>
                      <div style={{ fontSize: "1rem", fontWeight: 500 }}>{item.name}</div>
                    </div>
                    <button 
                      onClick={() => handleComplete(item.id)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                    >
                      <Square size={22} color="var(--text-muted)" style={{ opacity: 0.8, transition: 'var(--transition-fast)' }} />
                    </button>
                  </div>
                  {item.reflection && (
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", backgroundColor: "rgba(0,0,0,0.2)", padding: "8px", borderRadius: "4px", width: "100%" }}>
                      {item.reflection}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText} style={{ textAlign: "center", padding: "24px 0" }}>未完了のタスクはありません</p>
          )}
        </section>
      </div>
    </div>
  );
}
