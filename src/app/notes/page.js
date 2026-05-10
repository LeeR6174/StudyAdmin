"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import { Lightbulb, Plus, Loader2, ChevronDown, Sparkles } from "lucide-react";
import { useAppContext } from "@/context/AppProvider";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = ["比較", "抽象", "ナイモノ", "流行", "普遍"];

export default function NotesPage() {
  const { showToast, isTestMode } = useAppContext();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("比較");
  const [content, setContent] = useState("");

  const fetchNotes = async () => {
    setIsLoading(true);
    if (isTestMode) {
      setItems([
        { id: "1", name: "スマホとガラケー", category: "比較", content: "物理キーの有無による身体性の違い。", createdAt: new Date().toISOString() },
        { id: "2", name: "サブスクリプション", category: "抽象", content: "所有から利用への転換。期間の細分化。", createdAt: new Date().toISOString() },
      ]);
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/notes");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);

    if (isTestMode) {
      setItems([{ id: Date.now().toString(), name, category, content, createdAt: new Date().toISOString() }, ...items]);
      showToast("テスト保存完了");
      resetForm();
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, content }),
      });
      if (res.ok) {
        showToast("アイデアを保存しました！");
        resetForm();
        fetchNotes();
      } else {
        throw new Error("保存失敗");
      }
    } catch (error) {
      showToast(`エラー: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setCategory("比較");
    setContent("");
    setShowAddForm(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className={styles.title}>思考ノート <Lightbulb size={24} style={{ color: 'var(--accent-primary)' }} /></h1>
          <p className={styles.subtitle}>5つの視点でコンテンツを深掘り</p>
        </div>
        <button 
          className={styles.iconBtn} 
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ background: showAddForm ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)', color: showAddForm ? '#0f172a' : 'white' }}
        >
          <Plus size={24} style={{ transform: showAddForm ? 'rotate(45deg)' : 'none', transition: '0.3s' }} />
        </button>
      </header>

      <div className={styles.content}>
        <AnimatePresence>
          {showAddForm && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', marginBottom: '32px' }}
            >
              <form onSubmit={handleSubmit} className="card" style={{ padding: '24px' }}>
                <div className={styles.inputGroup}>
                  <label className={styles.fieldLabel}>対象のコンテンツ</label>
                  <input 
                    type="text" value={name} onChange={(e) => setName(e.target.value)} 
                    placeholder="何についての思考？" className={styles.input} required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.fieldLabel}>視点を選択</label>
                  <div className={styles.quickBtnContainer}>
                    {CATEGORIES.map(c => (
                      <button 
                        key={c} type="button" 
                        onClick={() => setCategory(c)}
                        className={styles.quickBtn}
                        style={{ 
                          background: category === c ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.02)',
                          borderColor: category === c ? 'var(--accent-primary)' : 'var(--border-color)',
                          color: category === c ? 'var(--accent-primary)' : 'var(--text-muted)',
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.fieldLabel}>思考メモ</label>
                  <textarea 
                    value={content} onChange={(e) => setContent(e.target.value)} 
                    placeholder="思考を言語化しよう..." className={styles.input}
                    style={{ minHeight: '120px', resize: 'none' }}
                  />
                </div>

                <button type="submit" className={styles.primaryBtn} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={20} className={styles.spin} /> : <><Plus size={20} /> 保存する</>}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <Loader2 className={styles.spin} size={32} />
            <p>読み込み中...</p>
          </div>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>
            <Sparkles size={64} className={styles.emptyIcon} />
            <p>まだノートがありません。<br/>新しい視点で記録を始めましょう。</p>
          </div>
        ) : (
          <div className={styles.list}>
            {items.map((item) => (
              <motion.div 
                key={item.id} 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card"
                style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 800, 
                    color: 'var(--accent-primary)', 
                    background: 'rgba(56, 189, 248, 0.1)',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    textTransform: 'uppercase'
                  }}>
                    {item.category}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>{item.name}</h3>
                {item.content && (
                  <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '12px' }}>
                    {item.content}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
