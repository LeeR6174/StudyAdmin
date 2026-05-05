"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import { Settings, Database, Clock } from "lucide-react";
import { useAppContext } from "@/context/AppProvider";

export default function FeedbackPage() {
  const { isTestMode, toggleTestMode, showToast } = useAppContext();
  const [canSubmit, setCanSubmit] = useState(true);
  const [timeLeftStr, setTimeLeftStr] = useState("");

  useEffect(() => {
    checkRateLimit();
    const interval = setInterval(checkRateLimit, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const checkRateLimit = () => {
    try {
      const stored = localStorage.getItem("studyAdmin_feedbacks");
      if (stored) {
        const timestamps = JSON.parse(stored);
        const ONE_HOUR = 60 * 60 * 1000;
        const now = Date.now();
        const recent = timestamps.filter(t => now - t < ONE_HOUR);
        
        if (recent.length !== timestamps.length) {
          localStorage.setItem("studyAdmin_feedbacks", JSON.stringify(recent));
        }

        if (recent.length >= 3) {
          setCanSubmit(false);
          const oldest = Math.min(...recent);
          const unlockTime = oldest + ONE_HOUR;
          const waitMins = Math.ceil((unlockTime - now) / 60000);
          setTimeLeftStr(`約${waitMins}分`);
        } else {
          setCanSubmit(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      showToast("連続送信の制限中です");
      return;
    }
    
    try {
      const formData = new FormData(e.target);
      const res = await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString(),
      });
      
      if (res.ok) {
        showToast("送信が完了しました。ご意見ありがとうございます！");
        // Log submission
        const stored = localStorage.getItem("studyAdmin_feedbacks");
        const timestamps = stored ? JSON.parse(stored) : [];
        timestamps.push(Date.now());
        localStorage.setItem("studyAdmin_feedbacks", JSON.stringify(timestamps));
        checkRateLimit();
        e.target.reset();
      } else {
        showToast("送信に失敗しました。時間をおいて再度お試しください。");
      }
    } catch (error) {
      console.error(error);
      showToast("送信に失敗しました。");
    }
  };
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={28} />
            設定・意見箱
          </h1>
          <p className={styles.subtitle}>アプリの改善要望やバグ報告をどうぞ</p>
        </div>
      </header>
      
      <div className={styles.content}>
        {/* Test Mode Toggle Section */}
        <div className={styles.section} style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="#c084fc" />
              テストデータモード
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              オンにするとダミーデータを表示し、Notionへの通信を遮断します。
            </p>
          </div>
          <button 
            onClick={toggleTestMode}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              fontWeight: 'bold',
              background: isTestMode ? '#c084fc' : 'rgba(255, 255, 255, 0.1)',
              color: isTestMode ? 'white' : 'var(--text-main)',
              cursor: 'pointer'
            }}
          >
            {isTestMode ? "ON" : "OFF"}
          </button>
        </div>

        <div className={styles.section}>
          {/* Netlify Form standard structure */}
          <form name="contact" method="POST" onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input type="hidden" name="form-name" value="contact" />
            <p style={{ margin: 0 }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.9rem' }}>
                Name
                <input type="text" name="name" className={styles.input} style={{ marginTop: '4px' }} required disabled={!canSubmit} />
              </label>
            </p>
            <p style={{ margin: 0 }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.9rem' }}>
                Email
                <input type="email" name="email" className={styles.input} style={{ marginTop: '4px' }} required disabled={!canSubmit} />
              </label>
            </p>
            <p style={{ margin: 0 }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.9rem' }}>
                Message
                <textarea name="message" className={styles.input} style={{ marginTop: '4px', minHeight: '150px', resize: 'vertical' }} required disabled={!canSubmit} />
              </label>
            </p>
            <p style={{ margin: 0 }}>
              <button 
                type="submit" 
                className={styles.primaryBtn} 
                disabled={!canSubmit}
                style={{ opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
              >
                {canSubmit ? "Send" : `送信制限中 (${timeLeftStr}後に解除)`}
              </button>
            </p>
            {!canSubmit && (
              <p style={{ fontSize: '0.8rem', color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '-8px' }}>
                <Clock size={14} /> 短時間での連続送信を制限しています。
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
