"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { Search, Filter, Calendar, Loader2 } from "lucide-react";
import { useAppContext } from "@/context/AppProvider";

export default function MirrorPage() {
  const { isTeacherMode } = useAppContext();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch("/api/logs");
        if (res.ok) {
          const data = await res.json();
          // Format dates
          const formattedLogs = data.map(log => {
            const dateObj = new Date(log.date);
            const formattedDate = dateObj.toLocaleDateString("ja-JP", { 
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" 
            });
            return { ...log, dateFormatted: formattedDate };
          });
          setLogs(formattedLogs);
        }
      } catch (error) {
        console.error("Failed to fetch logs", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLogs();
  }, []);

  return (
    <div className={`${styles.container} ${isTeacherMode ? styles.teacherModeTheme : ""}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>振り返り</h1>
        <p className={styles.subtitle}>過去の軌跡からパターンを学ぶ</p>
      </header>

      <div className={styles.controlsRow}>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input type="text" placeholder="ログを検索..." className={styles.searchInput} />
        </div>
        <button className={styles.filterBtn}>
          <Filter size={18} />
        </button>
      </div>

      <div className={styles.timelineContainer}>
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)" }}>
            <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
            <span>Notionからログを取得中...</span>
          </div>
        ) : (
          <>
            <div className={styles.timelineLine} />
            {logs.map((log) => (
              <div key={log.id} className={styles.logEntry}>
                <div className={`${styles.logDot} ${log.isTeacherLog ? styles.teacherDot : ""}`} />
                <div className={`${styles.logCard} ${log.isTeacherLog ? styles.teacherCard : ""}`}>
                  <div className={styles.logHeader}>
                    <div className={styles.logDate}>
                      <Calendar size={14} />
                      <span>{log.dateFormatted}</span>
                    </div>
                    <div className={styles.tagsContainer}>
                      <span className={`${styles.tag} ${log.isTeacherLog ? styles.teacherTag : ""}`}>
                        {log.type}
                      </span>
                    </div>
                  </div>
                  <p className={styles.logContent}>{log.content}</p>
                </div>
              </div>
            ))}
            
            {logs.length === 0 && (
              <p style={{ color: "var(--text-muted)" }}>まだログがありません。</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
