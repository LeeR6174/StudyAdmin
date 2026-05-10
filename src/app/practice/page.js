"use client";

import { useState, useEffect, useRef } from "react";
import styles from "../page.module.css";
import { Send, CheckCircle2, History, MessageSquarePlus, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useAppContext } from "@/context/AppProvider";
import { motion, AnimatePresence } from "framer-motion";

export default function PracticePage() {
  const { showToast, isTestMode } = useAppContext();
  
  // App State: 'chat' | 'reflect' | 'history'
  const [view, setView] = useState("chat");
  
  // Chat State
  const [messages, setMessages] = useState([]);
  const [currentRole, setCurrentRole] = useState("A"); // 'A' or 'B'
  const [inputText, setInputText] = useState("");
  
  // Reflection State
  const [reflection, setReflection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // History State
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, view]);

  // Fetch History
  const fetchHistory = async () => {
    setHistoryLoading(true);
    if (isTestMode) {
      setHistory([
        { 
          id: "h1", 
          date: new Date().toISOString(), 
          content: "A: こんにちは\nB: どうも、はじめまして\nA: 今日は何を練習しますか？\nB: 接客の練習をお願いします\n\n【反省】\nA役の言葉遣いが少し丁寧すぎたかもしれない。もう少し親しみやすさを出す。", 
          type: "会話練習" 
        }
      ]);
      setHistoryLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.filter(log => log.type === "会話練習"));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      role: currentRole,
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText("");
    // Auto-toggle role for convenience
    setCurrentRole(currentRole === "A" ? "B" : "A");
  };

  const handleFinishChat = () => {
    if (messages.length === 0) return;
    setView("reflect");
  };

  const handleSavePractice = async () => {
    setIsSubmitting(true);
    
    const conversationText = messages.map(m => `${m.role}: ${m.text}`).join("\n");
    const fullContent = `${conversationText}\n\n【反省】\n${reflection || "（なし）"}`;
    
    if (isTestMode) {
      showToast("テストモード: 保存しました(模拟)");
      resetPractice();
      return;
    }

    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: fullContent,
          type: "会話練習"
        })
      });
      
      if (res.ok) {
        showToast("練習記録をNotionに保存しました！");
        resetPractice();
      } else {
        throw new Error("保存に失敗しました");
      }
    } catch (error) {
      showToast(`エラー: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPractice = () => {
    setMessages([]);
    setReflection("");
    setView("chat");
    setCurrentRole("A");
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.container} style={{ height: 'calc(100vh - var(--nav-height))', display: 'flex', flexDirection: 'column' }}>
      <header className={styles.header} style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div>
            <h1 className={styles.title}>Dialogue</h1>
            <p className={styles.subtitle}>
              {view === "chat" ? "一人二役で会話をシミュレーション" : 
               view === "reflect" ? "練習を振り返る" : "過去の練習記録"}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={styles.iconBtn} 
              onClick={() => {
                if (view === "history") setView("chat");
                else {
                  setView("history");
                  fetchHistory();
                }
              }}
              style={{ background: view === "history" ? 'var(--accent-primary)' : 'var(--bg-surface)', color: view === "history" ? 'white' : 'inherit' }}
            >
              <History size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className={styles.content} style={{ flex: 1, overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="wait">
          
          {/* CHAT VIEW */}
          {view === "chat" && (
            <motion.div 
              key="chat" 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              <div ref={scrollRef} className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {messages.length === 0 ? (
                  <div className={styles.emptyState} style={{ marginTop: '40px' }}>
                    <MessageSquarePlus size={48} className={styles.emptyIcon} />
                    <p>練習を開始しましょう。<br/>A役かB役としてメッセージを入力してください。</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {messages.map((msg) => (
                      <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        style={{ 
                          alignSelf: msg.role === 'A' ? 'flex-start' : 'flex-end',
                          maxWidth: '85%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: msg.role === 'A' ? 'flex-start' : 'flex-end'
                        }}
                      >
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', gap: '6px', fontWeight: 700 }}>
                          役 {msg.role}
                        </div>
                        <div style={{ 
                          padding: '14px 18px', 
                          borderRadius: msg.role === 'A' ? '4px 24px 24px 24px' : '24px 4px 24px 24px',
                          background: msg.role === 'A' ? 'rgba(255,255,255,0.04)' : 'var(--accent-primary-gradient)',
                          color: msg.role === 'A' ? 'var(--text-main)' : '#0f172a',
                          boxShadow: msg.role === 'A' ? 'var(--shadow-sm)' : '0 4px 15px rgba(56, 189, 248, 0.2)',
                          fontSize: '1rem',
                          lineHeight: 1.6,
                          border: msg.role === 'A' ? '1px solid var(--border-color)' : 'none'
                        }}>
                          {msg.text}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>{msg.timestamp}</div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chat Controls */}
              <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  <button 
                    onClick={() => setCurrentRole("A")}
                    style={{ 
                      flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)',
                      background: currentRole === "A" ? 'rgba(255,255,255,0.1)' : 'transparent',
                      color: currentRole === "A" ? 'var(--accent-primary)' : 'var(--text-muted)',
                      fontWeight: 600, fontSize: '0.85rem'
                    }}
                  >役 A</button>
                  <button 
                    onClick={() => setCurrentRole("B")}
                    style={{ 
                      flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)',
                      background: currentRole === "B" ? 'rgba(255,255,255,0.1)' : 'transparent',
                      color: currentRole === "B" ? 'var(--accent-primary)' : 'var(--text-muted)',
                      fontWeight: 600, fontSize: '0.85rem'
                    }}
                  >役 B</button>
                </div>
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`役 ${currentRole} として入力...`}
                    className={styles.input}
                    style={{ flex: 1, marginBottom: 0 }}
                  />
                  <button type="submit" className={styles.primaryBtn} style={{ padding: '0 15px', borderRadius: '12px' }}>
                    <Send size={20} />
                  </button>
                </form>
                {messages.length > 0 && (
                  <button 
                    onClick={handleFinishChat}
                    style={{ 
                      width: '100%', marginTop: '12px', padding: '10px', borderRadius: '12px', 
                      background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)',
                      fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    <CheckCircle2 size={18} /> 練習を終了して振り返る
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* REFLECT VIEW */}
          {view === "reflect" && (
            <motion.div 
              key="reflect" 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '24px' }} className="no-scrollbar">
                <h3 className={styles.fieldLabel}>会話のサマリー</h3>
                <div className="card" style={{ padding: '20px', fontSize: '0.9rem', background: 'rgba(0,0,0,0.15)' }}>
                  {messages.map(m => (
                    <div key={m.id} style={{ marginBottom: '10px', lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 800, color: m.role === 'A' ? 'var(--text-muted)' : 'var(--accent-primary)' }}>{m.role}:</span> {m.text}
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.fieldLabel}>反省・気づき</label>
                <textarea 
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="良かった点、改善点、次に活かしたいこと..."
                  className={styles.input}
                  style={{ minHeight: '160px', resize: 'none' }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setView("chat")}
                  className={styles.secondaryBtn}
                  style={{ flex: 1, padding: '16px' }}
                >
                  戻る
                </button>
                <button 
                  onClick={handleSavePractice}
                  disabled={isSubmitting}
                  className={styles.primaryBtn}
                  style={{ flex: 2 }}
                >
                  {isSubmitting ? <Loader2 size={18} className={styles.spin} /> : "練習を記録する"}
                </button>
              </div>
            </motion.div>
          )}

          {/* HISTORY VIEW */}
          {view === "history" && (
            <motion.div 
              key="history" 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              style={{ flex: 1, padding: '24px', overflowY: 'auto' }}
              className="no-scrollbar"
            >
              {historyLoading ? (
                <div className={styles.loadingContainer}>
                  <Loader2 className={styles.spin} size={32} />
                  <p>読み込み中...</p>
                </div>
              ) : history.length === 0 ? (
                <div className={styles.emptyState}>
                  <History size={64} className={styles.emptyIcon} />
                  <p>まだ練習記録がありません。</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {history.map((item) => (
                    <div key={item.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                      <div 
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      >
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{formatDate(item.date)}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {item.content.split('\n')[0].slice(0, 35)}...
                          </div>
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
                            <pre style={{ 
                              padding: '20px', 
                              whiteSpace: 'pre-wrap', 
                              fontSize: '0.9rem', 
                              fontFamily: 'inherit',
                              lineHeight: 1.7,
                              color: 'var(--text-main)'
                            }}>
                              {item.content}
                            </pre>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
