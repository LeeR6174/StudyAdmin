"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import { Database, Plus, Loader2, CheckSquare, Square, RefreshCw, Bell, MapPin, Calendar } from "lucide-react";
import { useAppContext } from "@/context/AppProvider";

export default function AllDbPage() {
  const { showToast, isTestMode, setAllDbTaskCount } = useAppContext();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [memo, setMemo] = useState("");
  const [deadline, setDeadline] = useState("");
  const [location, setLocation] = useState("");

  const fetchItems = async () => {
    setIsLoading(true);
    if (isTestMode) {
      const dummy = [
        { id: "test1", name: "洗剤のストックを買う", memo: "特売の詰め替え用を2つ", deadline: new Date().toISOString().split("T")[0], location: "スーパー", isCompleted: false },
        { id: "test2", name: "〇〇さんにLINEを返す", memo: "今週末の予定について", deadline: new Date().toISOString().split("T")[0], location: "スマホ", isCompleted: false },
        { id: "test3", name: "市役所で書類の手続き", memo: "マイナンバーカードと印鑑を持参", deadline: new Date(Date.now() + 86400000).toISOString().split("T")[0], location: "市役所", isCompleted: false },
        { id: "test4", name: "美容室の予約を入れる", memo: "来週の土曜の午後で", deadline: "", location: "スマホ", isCompleted: false },
      ];
      setItems(dummy);
      setAllDbTaskCount(dummy.filter(i => !i.isCompleted).length);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/alldb");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        setAllDbTaskCount(data.filter(i => !i.isCompleted).length);
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

  const handleSendToReminder = (item) => {
    if (!item.deadline) {
      showToast("期限が設定されていないため、時間指定でリマインダーに送れません。");
      return;
    }
    const url = `shortcuts://x-callback-url/run-shortcut?name=StudyAdminReminder&input=text&text=${encodeURIComponent(item.name + "||" + item.deadline)}`;
    window.location.href = url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    
    if (isTestMode) {
      const created = { id: Date.now().toString(), name, memo, deadline, location, isCompleted: false };
      setName("");
      setMemo("");
      setDeadline("");
      setLocation("");
      setItems((prev) => [created, ...prev]);
      setAllDbTaskCount(prev => prev + 1);
      showToast("テストデータを作成しました！");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = { name, memo, deadline, location };
      const res = await fetch("/api/alldb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

        if (res.ok) {
          const created = await res.json();
          setName("");
          setMemo("");
          setDeadline("");
          setLocation("");
          setItems((prev) => [created, ...prev]);
          setAllDbTaskCount(prev => prev + 1);
          showToast("データを作成しました！");
        } else {
          const errData = await res.json();
          throw new Error(errData.error || "保存に失敗しました");
        }
      } catch (error) {
        console.error("Submit error", error);
        showToast(`エラー: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
  };

  const handleComplete = async (id) => {
    // Optimistic update: remove from the uncompleted list
    setItems((prev) => prev.filter((item) => item.id !== id));
    setAllDbTaskCount(prev => prev > 0 ? prev - 1 : 0);
    showToast("完了にしました！");
    if (isTestMode) return;
    try {
      const res = await fetch("/api/alldb", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isCompleted: true }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "更新に失敗しました");
      }
    } catch (error) {
      console.error("Failed to complete task", error);
      showToast(`エラー: ${error.message}`);
      // 失敗した場合はリストを戻す必要があるが、簡易化のためログ出力のみ
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className={styles.title}>ALL DB</h1>
            <button className={styles.iconBtn} onClick={fetchItems} disabled={isLoading} style={{ padding: '8px', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', borderRadius: '50%' }}>
              <RefreshCw size={20} className={isLoading ? styles.spin : ""} />
            </button>
          </div>
          <p className={styles.subtitle}>すべてのデータを集約</p>
        </div>
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
                <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}><Calendar size={14} /> 期限</label>
                <input 
                  type="date" 
                  value={deadline} 
                  onChange={(e) => setDeadline(e.target.value)} 
                  className={styles.input}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={14} /> 場所</label>
                <input 
                  type="text"
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  placeholder="例: スーパー、〇〇駅..."
                  className={styles.input}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px", display: "block" }}>メモ</label>
              <textarea 
                value={memo} 
                onChange={(e) => setMemo(e.target.value)} 
                placeholder="補足情報など..." 
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
          <div className={styles.content}>
        <div className={styles.list}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <Loader2 className={styles.spin} size={24} />
              <p>データを取得中...</p>
            </div>
          ) : items.filter(i => !i.isCompleted).length === 0 ? (
            <div className={styles.emptyState}>
              <Database size={48} className={styles.emptyIcon} />
              <p>未完了のタスクはありません。</p>
            </div>
          ) : (
            items.filter(i => !i.isCompleted).map((item) => (
              <div key={item.id} className={styles.studentTaskCard} style={{ flexDirection: "column", alignItems: "flex-start", gap: "12px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, paddingRight: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                      {item.deadline && <span style={{ fontSize: "0.75rem", color: "var(--accent-primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><Calendar size={12}/>{item.deadline}</span>}
                      {item.location && (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ fontSize: "0.7rem", backgroundColor: "var(--bg-surface)", padding: "2px 6px", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "4px", color: "inherit", textDecoration: "none" }}
                        >
                          <MapPin size={10}/>{item.location}
                        </a>
                      )}
                    </div>
                    <div style={{ fontSize: "1rem", fontWeight: 500 }}>{item.name}</div>
                  </div>
                  <button 
                    onClick={() => handleComplete(item.id)} 
                    className={styles.checkboxBtn}
                    aria-label="完了にする"
                  ></button>
                </div>
                {item.memo && (
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", backgroundColor: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "8px", width: "100%", marginTop: "4px", border: "1px solid var(--border-color)" }}>
                    {item.memo}
                  </div>
                )}
                
                {/* Reminders integration */}
                <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                  <button 
                    onClick={() => handleSendToReminder(item)}
                    style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--accent-primary)", background: "transparent", border: "1px solid var(--accent-primary)", padding: "4px 10px", borderRadius: "16px", cursor: "pointer" }}
                  >
                    <Bell size={14} /> iOSリマインダーへ
                  </button>
                </div>
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
