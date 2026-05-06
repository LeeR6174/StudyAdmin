"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import { Database, Plus, Loader2, CheckSquare, Square, RefreshCw, Bell, MapPin, Calendar } from "lucide-react";
import { useAppContext } from "@/context/AppProvider";

export default function InboxPage() {
  const { showToast, isTestMode, setInboxCount } = useAppContext();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [memo, setMemo] = useState("");
  const [deadline, setDeadline] = useState("");
  const [location, setLocation] = useState("");

  const formatDeadline = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const month = d.getMonth() + 1;
      const date = d.getDate();
      const hours = d.getHours().toString().padStart(2, "0");
      const minutes = d.getMinutes().toString().padStart(2, "0");
      
      // If it's a date only (time is 00:00 and not specified), or just to be safe
      if (dateStr.includes("T")) {
        return `${month}/${date} ${hours}:${minutes}`;
      }
      return `${month}/${date}`;
    } catch (e) {
      return dateStr;
    }
  };

  const formatForShortcut = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const yyyy = d.getFullYear();
      const mm = (d.getMonth() + 1).toString().padStart(2, "0");
      const dd = d.getDate().toString().padStart(2, "0");
      const hh = d.getHours().toString().padStart(2, "0");
      const min = d.getMinutes().toString().padStart(2, "0");
      return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
    } catch (e) {
      return dateStr;
    }
  };

  const setQuickDeadline = (type) => {
    const now = new Date();
    let target = new Date(now);

    switch (type) {
      case "30m":
        target.setMinutes(now.getMinutes() + 30);
        break;
      case "1h":
        target.setHours(now.getHours() + 1);
        break;
      case "nextHour":
        target.setHours(now.getHours() + 1, 0, 0, 0);
        break;
      case "18:00":
        target.setHours(18, 0, 0, 0);
        break;
      case "tomorrow8:50":
        target.setDate(now.getDate() + 1);
        target.setHours(8, 50, 0, 0);
        break;
      default:
        return;
    }

    // Format to YYYY-MM-DDTHH:mm for datetime-local
    const yyyy = target.getFullYear();
    const mm = (target.getMonth() + 1).toString().padStart(2, "0");
    const dd = target.getDate().toString().padStart(2, "0");
    const hh = target.getHours().toString().padStart(2, "0");
    const min = target.getMinutes().toString().padStart(2, "0");
    
    setDeadline(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
  };

  const fetchItems = async () => {
    setIsLoading(true);
    if (isTestMode) {
      const dummy = [
        { id: "test1", name: "洗剤のストックを買う", memo: "特売の詰め替え用を2つ", deadline: new Date().toISOString().substring(0, 16), location: "スーパー", isCompleted: false },
        { id: "test2", name: "〇〇さんにLINEを返す", memo: "今週末の予定について", deadline: new Date().toISOString().substring(0, 16), location: "スマホ", isCompleted: false },
        { id: "test3", name: "市役所で書類の手手続き", memo: "マイナンバーカードと印鑑を持参", deadline: new Date(Date.now() + 86400000).toISOString().substring(0, 16), location: "市役所", isCompleted: false },
        { id: "test4", name: "美容室の予約を入れる", memo: "来週の土曜の午後で", deadline: "", location: "スマホ", isCompleted: false },
      ];
      setItems(dummy);
      setInboxCount(dummy.filter(i => !i.isCompleted).length);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/inbox");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        setInboxCount(data.filter(i => !i.isCompleted).length);
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
    const formattedDate = formatForShortcut(item.deadline);
    const url = `shortcuts://x-callback-url/run-shortcut?name=StudyAdminReminder&input=text&text=${encodeURIComponent(item.name + "||" + formattedDate)}`;
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
      setInboxCount(prev => prev + 1);
      showToast("テストデータを作成しました！");
      setIsSubmitting(false);
      return;
    }

    try {
      // Convert to full ISO string for Notion API if it's a datetime
      let formattedDeadline = deadline;
      if (deadline && deadline.includes("T")) {
        try {
          formattedDeadline = new Date(deadline).toISOString();
        } catch (e) {
          console.error("Date conversion failed", e);
        }
      }

      const payload = { name, memo, deadline: formattedDeadline, location };
      const res = await fetch("/api/inbox", {
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
          setInboxCount(prev => prev + 1);
          showToast("Notionへ保存しました！");
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
    setInboxCount(prev => prev > 0 ? prev - 1 : 0);
    showToast("完了にしました！");
    if (isTestMode) return;
    try {
      const res = await fetch("/api/inbox", {
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
            <h1 className={styles.title}>Inbox</h1>
            <button className={styles.iconBtn} onClick={fetchItems} disabled={isLoading} style={{ padding: '8px', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', borderRadius: '50%' }}>
              <RefreshCw size={20} className={isLoading ? styles.spin : ""} />
            </button>
          </div>
          <p className={styles.subtitle}>急なタスクやメモを素早く記録</p>
        </div>
      </header>

      <div className={`${styles.content} no-scrollbar`}>
        {/* Entry Form */}
        <section className={styles.section} style={{ marginBottom: "24px" }}>
          <h2 className={styles.sectionTitle}><Database size={18} /> 新規追加</h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
            
            <div className={styles.inputGroup}>
              <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block" }}>名前 (Title)</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="タスクを記入" 
                className={styles.input} 
                required 
              />
            </div>

            <div className={styles.inputRow}>
              <div style={{ flex: 1.3 }} className={styles.inputGroup}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}><Calendar size={14} /> 期限</label>
                <input 
                  type="datetime-local" 
                  value={deadline} 
                  onChange={(e) => setDeadline(e.target.value)} 
                  className={styles.input}
                />
                <div className={styles.quickBtnContainer}>
                  <button type="button" onClick={() => setQuickDeadline("30m")} className={styles.quickBtn}>+30分</button>
                  <button type="button" onClick={() => setQuickDeadline("1h")} className={styles.quickBtn}>+1h</button>
                  <button type="button" onClick={() => setQuickDeadline("nextHour")} className={styles.quickBtn}>次時</button>
                  <button type="button" onClick={() => setQuickDeadline("18:00")} className={styles.quickBtn}>18:00</button>
                  <button type="button" onClick={() => setQuickDeadline("tomorrow8:50")} className={styles.quickBtn}>明日8:50</button>
                </div>
              </div>
              <div style={{ flex: 0.7 }} className={styles.inputGroup}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={14} /> 場所</label>
                <input 
                  type="text"
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  placeholder="場所..."
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block" }}>メモ</label>
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
                      {item.deadline && <span style={{ fontSize: "0.75rem", color: "var(--accent-primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><Calendar size={12}/>{formatDeadline(item.deadline)}</span>}
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

        {/* Completed tasks toggle */}
        <section className={styles.section} style={{ marginTop: "0" }}>
          <button
            onClick={() => setShowCompleted(v => !v)}
            style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.875rem", cursor: "pointer", width: "100%", padding: 0 }}
          >
            {showCompleted ? "▲" : "▼"} 完了済み ({items.filter(i => i.isCompleted).length}件)
          </button>
          {showCompleted && (
            <div className={styles.list} style={{ marginTop: "12px" }}>
              {items.filter(i => i.isCompleted).length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>完了済みはありません</p>
              ) : (
                items.filter(i => i.isCompleted).map(item => (
                  <div key={item.id} style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "12px", opacity: 0.5 }}>
                    <CheckSquare size={16} style={{ color: "var(--accent-success)", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.9rem", textDecoration: "line-through", color: "var(--text-muted)" }}>{item.name}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
