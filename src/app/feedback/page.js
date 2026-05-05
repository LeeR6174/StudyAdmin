"use client";

import styles from "../page.module.css";
import { Settings } from "lucide-react";

export default function FeedbackPage() {
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
