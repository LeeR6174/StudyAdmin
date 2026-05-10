"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import { PenTool, Send, Loader2, Calendar, Sparkles, MessageSquare, ChevronDown, ChevronUp, History } from "lucide-react";
import { useAppContext } from "@/context/AppProvider";
import { motion, AnimatePresence } from "framer-motion";

export default function RoleLetteringPage() {
  const { showToast, isTestMode, letterBadge, setLetterBadge } = useAppContext();
  const [lastTrouble, setLastTrouble] = useState("読み込み中...");
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [answer, setAnswer] = useState("");
  const [threeThings, setThreeThings] = useState(["", "", ""]);
  const [thisWeekTrouble, setThisWeekTrouble] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    if (isTestMode) {
      setLastTrouble("テストモード: 先週のお悩みはここに表示されます。");
      setHistory([
        { id: "1", date: new Date().toISOString(), answer: "解決しました！", threeThings: "1.運動 2.読書 3.早起き", thisWeekTrouble: "特になし" }
      ]);
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/letters");
      if (res.ok) {
        const data = await res.json();
        setLastTrouble(data.lastTrouble || "（初回です。自分へのメッセージを始めましょう）");
        setHistory(data.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (isTestMode) {
      showToast("テスト保存完了");
      resetForm();
      setIsSubmitting(false);
      setIsSessionActive(false);
      setLetterBadge(false);
      return;
    }

    try {
      const formattedThreeThings = threeThings.map((t, i) => `${i + 1}. ${t}`).join("\n");
      const res = await fetch("/api/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer, threeThings: formattedThreeThings, thisWeekTrouble }),
      });
      if (res.ok) {
        showToast("今週のレターを保存しました");
        resetForm();
        fetchData();
        setIsSessionActive(false);
        setLetterBadge(false); // Clear badge on success
      }
    } catch (error) {
      showToast("エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAnswer("");
    setThreeThings(["", "", ""]);
    setThisWeekTrouble("");
  };

  return (
    <div className={styles.container}>
      <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className={styles.title}>Role Lettering <PenTool size={24} style={{ color: 'var(--accent-primary)' }} /></h1>
          <p className={styles.subtitle}>自分への手紙で一週間を繋ぐ</p>
        </div>
        <button 
          onClick={() => {
            setLetterBadge(!letterBadge);
            showToast(letterBadge ? "通知バッジを非表示にしました" : "通知バッジを表示しました（テスト）");
          }}
          className={styles.iconBtn}
          style={{ background: letterBadge ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)', color: letterBadge ? '#0f172a' : 'white' }}
        >
          <Sparkles size={20} />
        </button>
      </header>

      <div className={styles.content}>
        <AnimatePresence mode="wait">
          {!isSessionActive ? (
            <motion.div 
              key="start-btn"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ marginBottom: '40px' }}
            >
              <button 
                onClick={() => setIsSessionActive(true)}
                className="card"
                style={{ 
                  width: '100%', 
                  padding: '48px 24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '20px',
                  background: 'rgba(56, 189, 248, 0.03)',
                  border: letterBadge ? '1px solid var(--accent-primary)' : '1px solid rgba(56, 189, 248, 0.1)',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                {letterBadge && (
                  <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--accent-danger)', color: 'white', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', fontWeight: 800 }}>
                    実施時期です！
                  </div>
                )}
                <div style={{ 
                  width: '64px', height: '64px', borderRadius: '50%', 
                  background: 'var(--accent-primary-gradient)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 25px rgba(56, 189, 248, 0.3)'
                }}>
                  <PenTool size={32} color="#0f172a" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>週次レターを開始する</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>自分自身と向き合い、一週間を繋ぎましょう</p>
                </div>
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="session-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <form onSubmit={handleSubmit} className="card" style={{ padding: '24px', marginBottom: '40px' }}>
                <div className={styles.inputGroup}>
                  <label className={styles.fieldLabel} style={{ color: 'var(--accent-primary)' }}>先週の自分からの相談</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ 
                      background: 'rgba(56, 189, 248, 0.05)', 
                      padding: '16px', 
                      borderRadius: '4px 16px 16px 16px', 
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      color: 'var(--text-muted)',
                      position: 'relative'
                    }}>
                      {lastTrouble}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '24px', borderLeft: '2px solid rgba(56, 189, 248, 0.1)' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '4px' }}>今の自分からの返答</label>
                      <textarea 
                        value={answer} onChange={(e) => setAnswer(e.target.value)} 
                        placeholder="相談への答えを書いてみよう..." className={styles.input}
                        style={{ minHeight: '80px', resize: 'none', background: 'rgba(255,255,255,0.02)' }}
                        autoFocus
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.fieldLabel}>今週あった3つのこと</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {threeThings.map((thing, idx) => (
                      <input 
                        key={idx}
                        type="text"
                        value={thing}
                        onChange={(e) => {
                          const newThings = [...threeThings];
                          newThings[idx] = e.target.value;
                          setThreeThings(newThings);
                        }}
                        placeholder={`${idx + 1}. できたこと、嬉しかったこと`}
                        className={styles.input}
                        style={{ marginBottom: 0 }}
                      />
                    ))}
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.fieldLabel}>今週のお悩み</label>
                  <textarea 
                    value={thisWeekTrouble} onChange={(e) => setThisWeekTrouble(e.target.value)} 
                    placeholder="来週の自分に相談したいことは？" className={styles.input}
                    style={{ minHeight: '100px', resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setIsSessionActive(false)} className={styles.secondaryBtn} style={{ flex: 1 }}>キャンセル</button>
                  <button type="submit" className={styles.primaryBtn} disabled={isSubmitting} style={{ flex: 2 }}>
                    {isSubmitting ? <Loader2 size={20} className={styles.spin} /> : <><Send size={20} /> レターを送る</>}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={styles.header} style={{ marginBottom: '16px' }}>
          <h2 className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={16} /> 過去のレター
          </h2>
        </div>

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <Loader2 className={styles.spin} size={32} />
          </div>
        ) : history.length === 0 ? (
          <div className={styles.emptyState}>
            <Sparkles size={48} className={styles.emptyIcon} />
            <p>まだ履歴がありません。</p>
          </div>
        ) : (
          <div className={styles.list}>
            {history.map((item) => (
              <div key={item.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div 
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                      {new Date(item.date).toLocaleDateString()} の記録
                    </span>
                  </div>
                  {expandedId === item.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                <AnimatePresence>
                  {expandedId === item.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden', background: 'rgba(0,0,0,0.15)', borderTop: '1px solid var(--border-color)' }}
                    >
                      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>回答</label>
                          <p style={{ fontSize: '0.95rem', marginTop: '4px', lineHeight: 1.6 }}>{item.answer || "（空欄）"}</p>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>今週の3つ</label>
                          <p style={{ fontSize: '0.95rem', marginTop: '4px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{item.threeThings || "（空欄）"}</p>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>今週のお悩み</label>
                          <p style={{ fontSize: '0.95rem', marginTop: '4px', lineHeight: 1.6 }}>{item.thisWeekTrouble || "（空欄）"}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
