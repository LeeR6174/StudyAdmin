"use client";

import { useState } from "react";
import styles from "../page.module.css";
import { Send, CheckCircle2 } from "lucide-react";

export default function FeedbackPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Assuming a Netlify setup for simplicity, if not, this acts as a placeholder
    const form = e.target;
    const formData = new FormData(form);
    
    fetch('/', {
      method: 'POST',
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData).toString()
    })
    .then(() => setSubmitted(true))
    .catch((error) => {
      console.error('Form submission error', error);
      setSubmitted(true); // Still show success for UX in this dummy version
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>意見箱</h1>
          <p className={styles.subtitle}>アプリの改善要望やバグ報告をどうぞ</p>
        </div>
      </header>
      
      <div className={styles.content}>
        {submitted ? (
          <div className={styles.emptyState}>
            <CheckCircle2 size={48} className={styles.emptyIcon} />
            <p>ご意見ありがとうございます！<br/>今後の開発の参考にさせていただきます。</p>
          </div>
        ) : (
          <form 
            name="feedback"
            method="POST"
            data-netlify="true"
            onSubmit={handleSubmit}
            className={styles.section}
          >
            <input type="hidden" name="form-name" value="feedback" />
            <textarea 
              name="message"
              placeholder="ここに要望や意見を書いてください..."
              className={styles.input}
              style={{ minHeight: '200px', resize: 'vertical' }}
              required
            ></textarea>
            <button type="submit" className={styles.primaryBtn} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Send size={18} />
              送信する
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
