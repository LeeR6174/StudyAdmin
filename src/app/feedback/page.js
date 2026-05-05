"use client";

import styles from "../page.module.css";
import { Settings, Database } from "lucide-react";
import { useAppContext } from "@/context/AppProvider";

export default function FeedbackPage() {
  const { isTestMode, toggleTestMode } = useAppContext();
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
          <form name="contact" method="POST" data-netlify="true" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input type="hidden" name="form-name" value="contact" />
            <p style={{ margin: 0 }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.9rem' }}>
                Name
                <input type="text" name="name" className={styles.input} style={{ marginTop: '4px' }} required />
              </label>
            </p>
            <p style={{ margin: 0 }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.9rem' }}>
                Email
                <input type="email" name="email" className={styles.input} style={{ marginTop: '4px' }} required />
              </label>
            </p>
            <p style={{ margin: 0 }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.9rem' }}>
                Message
                <textarea name="message" className={styles.input} style={{ marginTop: '4px', minHeight: '150px', resize: 'vertical' }} required />
              </label>
            </p>
            <p style={{ margin: 0 }}>
              <button type="submit" className={styles.primaryBtn}>Send</button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
