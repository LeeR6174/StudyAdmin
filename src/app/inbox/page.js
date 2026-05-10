"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import { Database, Loader2, CheckSquare, RefreshCw, MapPin, Calendar, CheckCircle2 } from "lucide-react";
import { useAppContext } from "@/context/AppProvider";
import { motion, AnimatePresence } from "framer-motion";

export default function InboxViewPage() {
  const { showToast, isTestMode, setInboxCount } = useAppContext();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);

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
    } catch (e) {} finally { setIsLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

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
    } catch (e) { showToast("エラーが発生しました"); }
  };

  const activeItems = items.filter(i => !i.isCompleted);
  const completedItems = items.filter(i => i.isCompleted);

  const renderMemo = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline', wordBreak: 'break-all' }}>{part}</a>;
      }
      return part;
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className={styles.title}>Inbox <Database size={24} style={{ color: 'var(--accent-primary)' }} /></h1>
          <p className={styles.subtitle}>{activeItems.length}件の未完了</p>
        </div>
        <button className={styles.iconBtn} onClick={fetchItems} disabled={isLoading}>
          <RefreshCw size={20} className={isLoading ? styles.spin : ""} />
        </button>
      </header>

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <Loader2 className={styles.spin} size={32} />
          </div>
        ) : activeItems.length === 0 ? (
          <div className={styles.emptyState}>
            <CheckCircle2 size={64} className={styles.emptyIcon} style={{ color: 'var(--accent-success)' }} />
            <p>タスクはありません！</p>
          </div>
        ) : (
          <div className={styles.list} style={{ gap: '12px' }}>
            <AnimatePresence mode="popLayout">
              {activeItems.map((item) => (
                <motion.div 
                  key={item.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, x: 20 }}
                  className="card"
                  style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, flex: 1, lineHeight: 1.4 }}>{item.name}</h3>
                    <button 
                      onClick={() => handleComplete(item.id)} 
                      style={{ 
                        flexShrink: 0,
                        width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--accent-primary)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(56, 189, 248, 0.05)'
                      }}
                    >
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'transparent' }} />
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {item.deadline && <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14}/>{formatDeadline(item.deadline)}</span>}
                    {item.location && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14}/>{item.location}</span>}
                  </div>

                  {item.memo && (
                    <div style={{ 
                      fontSize: '0.85rem', 
                      color: 'var(--text-muted)', 
                      background: 'rgba(255,255,255,0.03)', 
                      padding: '10px', 
                      borderRadius: '8px',
                      marginTop: '4px',
                      whiteSpace: 'pre-wrap'
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
          <div style={{ marginTop: '40px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <button 
              onClick={() => setShowCompleted(!showCompleted)}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}
            >
              <span>完了済み ({completedItems.length})</span>
              <span>{showCompleted ? "閉じる" : "表示"}</span>
            </button>
            <AnimatePresence>
              {showCompleted && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden', marginTop: '16px' }}
                >
                  <div className={styles.list}>
                    {completedItems.map(item => (
                      <div key={item.id} className="card" style={{ padding: '16px', opacity: 0.5, display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <CheckSquare size={18} style={{ color: 'var(--accent-success)' }} />
                        <span style={{ textDecoration: 'line-through', fontSize: '0.95rem' }}>{item.name}</span>
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
  );
}
