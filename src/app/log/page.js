"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { Send, Loader2, BookOpen, UserCog, Lightbulb, AlertTriangle, FileText } from "lucide-react";
import { useAppContext } from "@/context/AppProvider";
import { motion, AnimatePresence } from "framer-motion";

const TEMPLATES = {
  KPT: {
    id: "KPT",
    name: "KPT法で振り返る",
    icon: Lightbulb,
    fields: [
      { id: "keep", label: "Keep (よかったこと・続けること)", placeholder: "集中して3時間作業できた" },
      { id: "problem", label: "Problem (課題・失敗したこと)", placeholder: "スマホを何度も見てしまった" },
      { id: "try", label: "Try (明日試すこと)", placeholder: "作業中はスマホを別の部屋に置く" }
    ]
  },
  FAILURE: {
    id: "FAILURE",
    name: "失敗から学ぶ",
    icon: AlertTriangle,
    fields: [
      { id: "event", label: "事象 (何が起きたか)", placeholder: "予定していたタスクが半分しか終わらなかった" },
      { id: "cause", label: "原因 (なぜ起きたか)", placeholder: "タスクの見積もり時間が甘かった" },
      { id: "lesson", label: "教訓・次へのアクション", placeholder: "明日はタスクを更に細分化して見積もる" }
    ]
  },
  FREE: {
    id: "FREE",
    name: "自由に書く",
    icon: FileText,
    fields: [
      { id: "free", label: "思考を書き出そう", placeholder: "いま考えていること、学んだこと..." }
    ]
  }
};

export default function LogPage() {
  const { isTeacherMode, showToast } = useAppContext();
  
  // Student State
  const [activeTemplate, setActiveTemplate] = useState("KPT");
  const [formData, setFormData] = useState({});
  
  // Teacher State
  const [teacherContent, setTeacherContent] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let submitContent = "";
    
    if (isTeacherMode) {
      if (!teacherContent.trim()) return;
      submitContent = teacherContent;
    } else {
      const template = TEMPLATES[activeTemplate];
      let hasData = false;
      
      const parts = template.fields.map(field => {
        const val = formData[field.id]?.trim();
        if (val) hasData = true;
        return `## ${field.label}\n${val || "（なし）"}`;
      });
      
      if (!hasData) return;
      submitContent = parts.join("\n\n");
    }

    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: submitContent, 
          isTeacherLog: isTeacherMode 
        })
      });

      if (res.ok) {
        if (isTeacherMode) {
          setTeacherContent("");
          showToast("評価を記録しました");
        } else {
          setFormData({});
          showToast("ログを保存しました");
        }
      }
    } catch (error) {
      console.error("Error submitting log:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${styles.container} ${isTeacherMode ? styles.teacherModeTheme : ""}`}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>
            {isTeacherMode ? "コーチングメモ" : "壁打ち"}
          </h1>
          {isTeacherMode ? <UserCog className={styles.teacherIcon} size={24} /> : <BookOpen size={24} className={styles.studentIcon} />}
        </div>
        <p className={styles.subtitle}>
          {isTeacherMode ? "生徒の今日のパフォーマンスを評価・記録" : "型に沿って思考を整理しよう"}
        </p>
      </header>

      {!isTeacherMode && (
        <div className={styles.templateSelector}>
          {Object.values(TEMPLATES).map(tmpl => {
            const Icon = tmpl.icon;
            const isActive = activeTemplate === tmpl.id;
            return (
              <button 
                key={tmpl.id}
                onClick={() => { setActiveTemplate(tmpl.id); setFormData({}); }}
                className={`${styles.templateBtn} ${isActive ? styles.activeTemplateBtn : ""}`}
              >
                <Icon size={16} />
                <span>{tmpl.name}</span>
              </button>
            );
          })}
        </div>
      )}

      <motion.div 
        className={styles.editorContainer}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        key={activeTemplate} // Re-animate on template change
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          
          <div className={`${styles.fieldsContainer} no-scrollbar`}>
            {isTeacherMode ? (
              <textarea
                value={teacherContent}
                onChange={(e) => setTeacherContent(e.target.value)}
                className={styles.teacherTextarea}
                placeholder="生徒（自分）の今日の取り組みはどうだったか？改善点や次のアクションは？"
                disabled={isSubmitting}
                autoFocus
              />
            ) : (
              TEMPLATES[activeTemplate].fields.map((field, idx) => (
                <div key={field.id} className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>{field.label}</label>
                  <textarea
                    value={formData[field.id] || ""}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className={styles.fieldTextarea}
                    placeholder={field.placeholder}
                    disabled={isSubmitting}
                    autoFocus={idx === 0}
                  />
                </div>
              ))
            )}
          </div>
          
          <div className={styles.actionRow}>
            <span className={styles.hint}>
              Markdown対応。送信するとNotionに自動保存されます。
            </span>
            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 size={18} className={styles.spin} />
              ) : (
                <>
                  <Send size={16} />
                  <span>{isTeacherMode ? "評価を記録" : "送信する"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
