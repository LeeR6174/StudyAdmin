"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { Plus, Loader2, Calendar, MapPin, Database, CheckSquare, RefreshCw, CheckCircle2, ChevronDown } from "lucide-react";
import { useAppContext } from "@/context/AppProvider";
import { motion, AnimatePresence } from "framer-motion";

import { useRouter } from "next/navigation";

export default function InboxPage() {
  const router = useRouter();
  const { showToast, isTestMode, inboxCount, setInboxCount, letterBadge } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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
      return dateStr.includes("T") ? `${month}/${date} ${hours}:${minutes}` : `${month}/${date}`;
    } catch (e) { return dateStr; }
  };

  const fetchItems = async () => {
    setIsLoading(true);
    if (isTestMode) {
      const dummy = [
        { id: "t1", name: "洗剤の補充", memo: "ドラッグストアで", deadline: new Date().toISOString(), location: "マツキヨ", isCompleted: false },
        { id: "t2", name: "月報の提出", memo: "Slackで送る", deadline: "", location: "自宅", isCompleted: false },
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
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (letterBadge === undefined || letterBadge === null) return;
    const hasRedirected = sessionStorage.getItem("studyAdmin_hasRedirectedToLetter");
    const today = new Date();
    const isWednesday = today.getDay() === 3;

    if (letterBadge && (isWednesday || isTestMode) && !hasRedirected) {
      sessionStorage.setItem("studyAdmin_hasRedirectedToLetter", "true");
      showToast("本日はRole Letteringの実施日です。画面へ移動します...");
      setTimeout(() => {
        router.push("/letters");
      }, 1500);
    }
  }, [letterBadge, isTestMode]);

  const setQuickDeadline = (type) => {
    const now = new Date();
    let target = new Date(now);

    switch (type) {
      case "30m": target.setMinutes(now.getMinutes() + 30); break;
      case "1h": target.setHours(now.getHours() + 1); break;
      case "nextHour": target.setHours(now.getHours() + 1, 0, 0, 0); break;
      case "18:00": target.setHours(18, 0, 0, 0); break;
      case "tomorrow8:50":
        target.setDate(now.getDate() + 1);
        target.setHours(8, 50, 0, 0);
        break;
      default: return;
    }

    const yyyy = target.getFullYear();
    const mm = (target.getMonth() + 1).toString().padStart(2, "0");
    const dd = target.getDate().toString().padStart(2, "0");
    const hh = target.getHours().toString().padStart(2, "0");
    const min = target.getMinutes().toString().padStart(2, "0");
    
    setDeadline(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    
    if (isTestMode) {
      const newItem = { id: Date.now().toString(), name, memo, deadline, location, isCompleted: false };
      setItems(prev => [newItem, ...prev]);
      setInboxCount(prev => prev + 1);
      setName(""); setMemo(""); setDeadline(""); setLocation("");
      setIsDetailsOpen(false);
      showToast("テストモード: 保存しました");
      setIsSubmitting(false);
      return;
    }

    try {
      let formattedDeadline = deadline;
      if (deadline && deadline.includes("T")) {
        try {
          formattedDeadline = new Date(deadline).toISOString();
        } catch (e) {}
      }

      const res = await fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, memo, deadline: formattedDeadline, location }),
      });

      if (res.ok) {
        setName(""); setMemo(""); setDeadline(""); setLocation("");
        setIsDetailsOpen(false);
        showToast("Inboxに保存しました！");
        await fetchItems();
      } else {
        throw new Error("保存に失敗しました");
      }
    } catch (error) {
      showToast(`エラー: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async (id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, isCompleted: true } : i));
    setInboxCount(prev => Math.max(0, prev - 1));
    showToast("完了しました");
    if (isTestMode) return;
    try {
      await fetch("/api/inbox", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isCompleted: true }),
      });
    } catch (e) {
      showToast("エラーが発生しました");
      await fetchItems();
    }
  };

  const renderMemo = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent-primary)", textDecoration: "underline", wordBreak: "break-all" }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const activeItems = items.filter(i => !i.isCompleted);
  const completedItems = items.filter(i => i.isCompleted);

  return (
    <div className={styles.container}>
      <header className={styles.header} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className={styles.title}>
            Inbox <Database size={24} style={{ color: "var(--accent-primary)" }} />
          </h1>
          <p className={styles.subtitle}>{isLoading ? "読み込み中..." : `${activeItems.length}件の未完了`}</p>
        </div>
        <button className={styles.iconBtn} onClick={fetchItems} disabled={isLoading}>
          <RefreshCw size={20} className={isLoading ? styles.spin : ""} />
        </button>
      </header>

      <div className={styles.content} style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        {/* ADD TASK FORM */}
        <form onSubmit={handleSubmit} className="card" style={{ padding: "24px" }}>
          <div className={styles.inputGroup} style={{ marginBottom: "16px" }}>
            <label className={styles.fieldLabel}>何をする？</label>
            <input 
              type="text" value={name} onChange={(e) => setName(e.target.value)} 
              placeholder="タスクの名前を入力..." 
              className={styles.input} 
              style={{ fontSize: "1.1rem", fontWeight: 600 }}
              required autoFocus
            />
          </div>

          {/* DETAILS TOGGLE */}
          <details 
            className={styles.detailsToggle} 
            open={isDetailsOpen}
            onToggle={(e) => setIsDetailsOpen(e.target.open)}
            style={{ marginBottom: "20px" }}
          >
            <summary style={{ 
              fontSize: "0.85rem", 
              color: "var(--accent-primary)", 
              cursor: "pointer", 
              fontWeight: 700,
              userSelect: "none",
              padding: "4px 0",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <span>詳細オプション (期限・場所・メモ)</span>
              <ChevronDown 
                size={14} 
                style={{ 
                  transform: isDetailsOpen ? "rotate(180deg)" : "rotate(0deg)", 
                  transition: "transform 0.2s ease" 
                }} 
              />
            </summary>
            
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                <label className={styles.fieldLabel}><Calendar size={14} /> 期限</label>
                <input 
                  type="datetime-local" value={deadline} 
                  onChange={(e) => setDeadline(e.target.value)} 
                  className={styles.input}
                />
                <div className={styles.quickBtnContainer} style={{ marginTop: "12px" }}>
                  {["30m", "1h", "nextHour", "18:00", "tomorrow8:50"].map(t => (
                    <button key={t} type="button" onClick={() => setQuickDeadline(t)} className={styles.quickBtn}>
                      {t === "30m" ? "+30分" : t === "1h" ? "+1時" : t === "nextHour" ? "次時" : t === "18:00" ? "18時" : "明日"}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                <label className={styles.fieldLabel}><MapPin size={14} /> 場所</label>
                <input 
                  type="text" value={location} onChange={(e) => setLocation(e.target.value)} 
                  placeholder="どこで？ (任意)" className={styles.input}
                />
              </div>

              <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                <label className={styles.fieldLabel}>詳細メモ</label>
                <textarea 
                  value={memo} onChange={(e) => setMemo(e.target.value)} 
                  placeholder="補足情報..." className={styles.input}
                  style={{ minHeight: "100px", resize: "none" }}
                />
              </div>
            </div>
          </details>

          <motion.button 
            type="submit" className={styles.primaryBtn} 
            disabled={isSubmitting}
            whileTap={{ scale: 0.98 }}
            style={{ minHeight: "52px", padding: "12px" }}
          >
            {isSubmitting ? <Loader2 size={22} className={styles.spin} /> : <><Plus size={22} /> <span>Inboxに保存</span></>}
          </motion.button>
        </form>

        {/* ITEMS LIST */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <Loader2 className={styles.spin} size={32} />
            </div>
          ) : activeItems.length === 0 ? (
            <div className={styles.emptyState}>
              <CheckCircle2 size={64} className={styles.emptyIcon} style={{ color: "var(--accent-success)" }} />
              <p>タスクはありません！</p>
            </div>
          ) : (
            <div className={styles.list} style={{ gap: "12px" }}>
              <AnimatePresence mode="popLayout">
                {activeItems.map((item) => (
                  <motion.div 
                    key={item.id} 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, x: 20 }}
                    className="card"
                    style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, flex: 1, lineHeight: 1.4 }}>{item.name}</h3>
                      <button 
                        onClick={() => handleComplete(item.id)} 
                        style={{ 
                          flexShrink: 0,
                          width: "32px", height: "32px", borderRadius: "50%", border: "2px solid var(--accent-primary)", 
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "rgba(99, 102, 241, 0.06)",
                          cursor: "pointer"
                        }}
                      >
                        <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "transparent" }} />
                      </button>
                    </div>
                    
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      {item.deadline && <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-primary)", display: "flex", alignItems: "center", gap: "4px" }}><Calendar size={14}/>{formatDeadline(item.deadline)}</span>}
                      {item.location && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={14}/>{item.location}</span>}
                    </div>

                    {item.memo && (
                      <div style={{ 
                        fontSize: "0.85rem", 
                        color: "var(--text-muted)", 
                        background: "rgba(255,255,255,0.03)", 
                        padding: "10px", 
                        borderRadius: "8px",
                        marginTop: "4px",
                        whiteSpace: "pre-wrap"
                      }}>
                        {renderMemo(item.memo)}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {completedItems.length > 0 && (
            <div style={{ marginTop: "24px", borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
              <button 
                onClick={() => setShowCompleted(!showCompleted)}
                style={{ width: "100%", display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 600, background: "transparent", border: "none", cursor: "pointer" }}
              >
                <span>完了済み ({completedItems.length})</span>
                <span>{showCompleted ? "閉じる" : "表示"}</span>
              </button>
              <AnimatePresence>
                {showCompleted && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: "hidden", marginTop: "16px" }}
                  >
                    <div className={styles.list}>
                      {completedItems.map(item => (
                        <div key={item.id} className="card" style={{ padding: "16px", opacity: 0.5, display: "flex", gap: "12px", alignItems: "center" }}>
                          <CheckSquare size={18} style={{ color: "var(--accent-success)" }} />
                          <span style={{ textDecoration: "line-through", fontSize: "0.95rem" }}>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
