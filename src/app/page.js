"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { Plus, Loader2, Calendar, MapPin, Sparkles } from "lucide-react";
import { useAppContext } from "@/context/AppProvider";
import { motion } from "framer-motion";

export default function EntryPage() {
  const { showToast, isTestMode, setInboxCount } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [memo, setMemo] = useState("");
  const [deadline, setDeadline] = useState("");
  const [location, setLocation] = useState("");

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
      setName(""); setMemo(""); setDeadline(""); setLocation("");
      setInboxCount(prev => prev + 1);
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
        setInboxCount(prev => prev + 1);
        showToast("Inboxに保存しました！");
      } else {
        throw new Error("保存に失敗しました");
      }
    } catch (error) {
      showToast(`エラー: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className={styles.container}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <header className={styles.header}>
        <motion.h1 className={styles.title} variants={itemVariants}>
          Quick Inbox <Sparkles size={24} style={{ color: 'var(--accent-secondary)' }} />
        </motion.h1>
        <motion.p className={styles.subtitle} variants={itemVariants}>
          忘れる前に、今すぐ記録。
        </motion.p>
      </header>

      <motion.div className={styles.content} variants={itemVariants}>
        <form onSubmit={handleSubmit} className="card" style={{ padding: '28px' }}>
          
          <div className={styles.inputGroup}>
            <label className={styles.fieldLabel}>何をする？</label>
            <input 
              type="text" value={name} onChange={(e) => setName(e.target.value)} 
              placeholder="タスクの名前を入力..." 
              className={styles.input} 
              style={{ fontSize: '1.1rem', fontWeight: 600 }}
              required autoFocus
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.fieldLabel}><Calendar size={14} /> 期限</label>
            <input 
              type="datetime-local" value={deadline} 
              onChange={(e) => setDeadline(e.target.value)} 
              className={styles.input}
            />
            <div className={styles.quickBtnContainer} style={{ marginTop: '12px' }}>
              {["30m", "1h", "nextHour", "18:00", "tomorrow8:50"].map(t => (
                <button key={t} type="button" onClick={() => setQuickDeadline(t)} className={styles.quickBtn}>
                  {t === "30m" ? "+30分" : t === "1h" ? "+1時" : t === "nextHour" ? "次時" : t === "18:00" ? "18時" : "明日"}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.fieldLabel}><MapPin size={14} /> 場所</label>
            <input 
              type="text" value={location} onChange={(e) => setLocation(e.target.value)} 
              placeholder="どこで？ (任意)" className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.fieldLabel}>詳細メモ</label>
            <textarea 
              value={memo} onChange={(e) => setMemo(e.target.value)} 
              placeholder="補足情報..." className={styles.input}
              style={{ minHeight: "120px", resize: "none" }}
            />
          </div>

          <motion.button 
            type="submit" className={styles.primaryBtn} 
            disabled={isSubmitting}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? <Loader2 size={24} className={styles.spin} /> : <><Plus size={24} /> <span>Inboxに保存</span></>}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}
