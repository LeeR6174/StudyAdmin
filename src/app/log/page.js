"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { Send, Loader2, BookOpen, UserCog, Lightbulb, AlertTriangle, FileText, ChevronDown, ChevronUp, Clock } from "lucide-react";
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
  },
  EXPECTATION: {
    id: "EXPECTATION",
    name: "理想と最悪の想定",
    icon: Lightbulb,
    fields: [
      { id: "ideal", label: "理想の状況", placeholder: "全てがうまくいった場合、どうなるか" },
      { id: "worst", label: "最悪の状況", placeholder: "想定される最悪の事態は何か" },
      { id: "action", label: "最悪に対する対処法", placeholder: "最悪の事態が起きたらどうカバーするか" }
    ]
  }
};

export default function LogPage() {
  const { isTeacherMode, showToast, isTestMode } = useAppContext();

  // Student State
  const [activeTemplate, setActiveTemplate] = useState("KPT");
  const [formData, setFormData] = useState({});

  // Teacher State
  const [teacherContent, setTeacherContent] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Past logs
  const [pastLogs, setPastLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [showPastLogs, setShowPastLogs] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    if (isTestMode) {
      setPastLogs([
        { id: "l1", content: "## Keep (よかったこと)\n集中して3時間作業できた\n\n## Problem (課題)\nスマホを何度も見てしまった\n\n## Try (明日試すこと)\n作業中はスマホを別の部屋に置く", type: "壁打ち", date: new Date(Date.now() - 86400000).toISOString(), isTeacherLog: false },
        { id: "l2", content: "今日の取り組みは概ね良好。ただしタスクの優先順位を明確にすること。", type: "コーチメモ", date: new Date(Date.now() - 86400000).toISOString(), isTeacherLog: true },
        { id: "l3", content: "## Keep\n英単語を毎朝30分続けられた\n\n## Problem\n数学の応用問題でつまずいた\n\n## Try\n基礎から復習する時間を作る", type: "壁打ち", date: new Date(Date.now() - 86400000 * 2).toISOString(), isTeacherLog: false },
      ]);
      setLogsLoading(false);
      return;
    }
    fetch("/api/logs")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setPastLogs(data);
        setLogsLoading(false);
      })
      .catch(() => setLogsLoading(false));
  }, [isTestMode]);

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

    if (isTestMode) {
      setTimeout(() => {
        setIsSubmitting(false);
        if (isTeacherMode) {
          setTeacherContent("");
        } else {
          setFormData({});
        }
        showToast("テストモード: Notionには送信されませんでした");
      }, 500);
      return;
    }

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
        const newLog = {
          id: Date.now().toString(),
          content: submitContent,
          type: isTeacherMode ? "コーチメモ" : activeTemplate,
          date: new Date().toISOString(),
          isTeacherLog: isTeacherMode,
        };
        setPastLogs(prev => [newLog, ...prev]);

        if (isTeacherMode) {
          setTeacherContent("");
          showToast("Notionへ評価を記録しました！");
        } else {
          setFormData({});
          showToast("Notionへログを保存しました！");
        }
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "保存に失敗しました");
      }
    } catch (error) {
      console.error("Error submitting log:", error);
      showToast(`エラー: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" });
    } catch {
      return dateStr;
    }
  };

  // Group logs by date
  const groupedLogs = pastLogs.reduce((acc, log) => {
    const dateKey = formatDate(log.date);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(log);
    return acc;
  }, {});

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
        key={activeTemplate}
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

      {/* Past Logs Section */}
      <div className={styles.pastLogsSection}>
        <button
          className={styles.pastLogsToggle}
          onClick={() => setShowPastLogs(v => !v)}
        >
          <Clock size={15} />
          <span>過去のログ {pastLogs.length > 0 ? `(${pastLogs.length}件)` : ""}</span>
          {showPastLogs ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        <AnimatePresence>
          {showPastLogs && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden" }}
            >
              {logsLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}>
                  <Loader2 size={20} className={styles.spin} style={{ color: "var(--text-muted)" }} />
                </div>
              ) : pastLogs.length === 0 ? (
                <p className={styles.noLogsText}>まだログがありません</p>
              ) : (
                <div className={styles.logHistoryList}>
                  {Object.entries(groupedLogs).map(([date, logs]) => (
                    <div key={date}>
                      <div className={styles.logDateHeader}>{date}</div>
                      {logs.map(log => (
                        <div key={log.id} className={`${styles.logHistoryItem} ${log.isTeacherLog ? styles.teacherLogItem : ""}`}>
                          <div
                            className={styles.logHistoryHeader}
                            onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                          >
                            <span className={`${styles.logTypeBadge} ${log.isTeacherLog ? styles.teacherBadge : ""}`}>
                              {log.isTeacherLog ? "コーチメモ" : log.type}
                            </span>
                            <span className={styles.logPreview}>
                              {log.content.replace(/##.*\n/g, "").trim().slice(0, 40)}...
                            </span>
                            {expandedLogId === log.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </div>
                          <AnimatePresence>
                            {expandedLogId === log.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ overflow: "hidden" }}
                              >
                                <pre className={styles.logFullContent}>{log.content}</pre>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
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
