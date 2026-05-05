"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { Lock, Plus, Target, CheckCircle2, X, UserCog, Loader2, MessageSquare, ArrowUpRight, Settings } from "lucide-react";
import { useAppContext } from "@/context/AppProvider";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import Link from "next/link";

export default function DeskPage() {
  const { isTeacherMode, showToast, isTestMode } = useAppContext();
  const [activeTab, setActiveTab] = useState("todo"); 

  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [recentLog, setRecentLog] = useState(null);
  const [bigGoals, setBigGoals] = useState([]);
  
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedGoalTitle, setSelectedGoalTitle] = useState("");

  useEffect(() => {
    async function fetchData() {
      if (isTestMode) {
        setTasks([
          { id: "test1", title: "数学 ページ20〜25", project: "期末テスト対策", status: "todo", isExecuting: false },
          { id: "test2", title: "英単語 100個暗記", project: "期末テスト対策", status: "todo", isExecuting: false },
          { id: "test3", title: "理科 過去問1年分", project: "期末テスト対策", status: "backlog", isExecuting: false },
          { id: "test4", title: "社会 歴史まとめノート", project: "期末テスト対策", status: "backlog", isExecuting: false },
          { id: "test5", title: "国語 漢字プリント", project: "日々の宿題", status: "done", isExecuting: false },
          { id: "test6", title: "英語 リスニング10分", project: "日々の宿題", status: "todo", isExecuting: false },
          { id: "test7", title: "プログラミング Reactの復習", project: "自己啓発", status: "backlog", isExecuting: false },
          { id: "test8", title: "ランニング 3km", project: "自己啓発", status: "done", isExecuting: false },
        ]);
        setBigGoals(["期末テスト対策", "日々の宿題", "自己啓発"]);
        setSelectedGoalTitle("期末テスト対策");
        setRecentLog({ date: new Date().toISOString(), type: "壁打ち", content: "テストまであと1週間。集中して頑張る！スマホは別の部屋に置くようにする。" });
        setIsLoading(false);
        return;
      }

      try {
        const [tasksRes, logsRes] = await Promise.all([
          fetch("/api/tasks"),
          fetch("/api/logs")
        ]);

        if (tasksRes.ok) {
          const data = await tasksRes.json();
          const tasksWithState = data.map(t => ({ ...t, isExecuting: false }));
          setTasks(tasksWithState);

          const projects = Array.from(new Set(data.map(t => t.project).filter(Boolean)));
          setBigGoals(projects);
          if (projects.length > 0) setSelectedGoalTitle(projects[0]);
        }

        if (logsRes.ok) {
          const logsData = await logsRes.json();
          // Find the most recent student log (not teacher log)
          const latestStudentLog = logsData.find(log => !log.isTeacherLog);
          if (latestStudentLog) {
            setRecentLog(latestStudentLog);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const addBigGoal = async (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    if (!bigGoals.includes(newGoalTitle)) {
      setBigGoals([...bigGoals, newGoalTitle]);
      if (isTestMode) {
        showToast("テストモード: Notionには保存されません");
      } else {
        try {
          await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: `【大目標】${newGoalTitle}`, project: newGoalTitle, status: "未アサイン" })
          });
        } catch (err) {}
      }
    }
    setSelectedGoalTitle(newGoalTitle);
    setNewGoalTitle("");
  };

  const addTaskToBacklog = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedGoalTitle) return;
    
    const tempId = Date.now().toString();
    const newTask = { id: tempId, project: selectedGoalTitle, title: newTaskTitle, status: "backlog", isExecuting: false };
    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle("");

    if (isTestMode) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTaskTitle, project: selectedGoalTitle, status: "未アサイン" })
      });
      if (res.ok) {
        const created = await res.json();
        setTasks(prev => prev.map(t => t.id === tempId ? { ...created, isExecuting: false } : t));
        showToast("タスクをストックしました");
      } else {
        setTasks(prev => prev.filter(t => t.id !== tempId));
      }
    } catch (e) {
      setTasks(prev => prev.filter(t => t.id !== tempId));
    }
  };

  const promoteToTodo = async (taskId) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "todo" } : t));
    showToast("宿題にアサインしました");
    if (isTestMode) return;
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status: "todo" })
    });
  };

  const revertToBacklog = async (taskId) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "backlog" } : t));
    showToast("アサインを取り消しました");
    if (isTestMode) return;
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status: "backlog" })
    });
  };

  // --- Student Actions ---
  const toggleExecuting = (taskId) => {
    if (isTeacherMode) return;
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, isExecuting: !t.isExecuting } : { ...t, isExecuting: false }
    ));
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus, isExecuting: false } : t
    ));
    if (newStatus === "done") {
      showToast("タスクを完了しました！");
    }
    if (isTestMode) return;
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus })
      });
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  const backlogTasks = tasks.filter(t => t.status === "backlog" && t.project === selectedGoalTitle && !t.title.startsWith("【大目標】"));
  const todoTasks = tasks.filter(t => t.status === "todo" && !t.title.startsWith("【大目標】"));
  const doneTasks = tasks.filter(t => t.status === "done" && !t.title.startsWith("【大目標】"));

  return (
    <div className={`${styles.container} ${isTeacherMode ? styles.teacherModeTheme : ""}`}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{isTeacherMode ? "コーチデスク" : "今日の宿題"}</h1>
          <p className={styles.subtitle}>{isTeacherMode ? "コーチング・ループの実践" : "一つずつ確実に終わらせよう"}</p>
        </div>
      </header>



      <div className={`${styles.content} no-scrollbar`}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <Loader2 size={32} className={styles.spin} />
            <p>Notionと同期中...</p>
          </div>
        ) : isTeacherMode ? (
          /* ================= TEACHER MODE UI ================= */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.teacherContainer}>
            
            {/* Step 1: Review Yesterday's Log */}
            <section className={`${styles.section} ${styles.highlightSection}`}>
              <h2 className={styles.sectionTitle}><MessageSquare size={18} /> Step 1: 昨日の振り返りを確認</h2>
              {recentLog ? (
                <div className={styles.recentLogCard}>
                  <p className={styles.logDate}>{new Date(recentLog.date).toLocaleDateString("ja-JP")} の壁打ち ({recentLog.type})</p>
                  <pre className={styles.logContent}>{recentLog.content}</pre>
                </div>
              ) : (
                <p className={styles.emptyText}>生徒の振り返りがまだありません。</p>
              )}
            </section>

            {/* Step 2: Big Goals & Decompose */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}><Target size={18} /> Step 2: 大目標の管理とタスク細分化</h2>
              <div className={styles.goalList}>
                {bigGoals.map(goal => (
                  <div key={goal} className={`${styles.goalItem} ${selectedGoalTitle === goal ? styles.selectedGoal : ""}`} onClick={() => setSelectedGoalTitle(goal)}>
                    {goal}
                  </div>
                ))}
              </div>
              <form onSubmit={addBigGoal} className={styles.addForm}>
                <input type="text" value={newGoalTitle} onChange={(e) => setNewGoalTitle(e.target.value)} placeholder="新しい大目標を追加..." className={styles.input} />
                <button type="submit" className={styles.iconSubmitBtn}><Plus size={20} /></button>
              </form>

              {selectedGoalTitle && (
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#c084fc" /> 
                    『{selectedGoalTitle}』のタスク
                  </h3>
                  <form onSubmit={addTaskToBacklog} className={styles.addForm}>
                    <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder={`${selectedGoalTitle} を分解...`} className={styles.input} />
                    <button type="submit" className={styles.iconSubmitBtn}><Plus size={20} /></button>
                  </form>
                  
                  <div className={styles.twoColTasks}>
                    <div className={styles.taskCol}>
                      <h4>未アサイン（プール）</h4>
                      <div className={styles.teacherTaskList}>
                        {backlogTasks.map(task => (
                          <div key={task.id} className={styles.teacherTaskCard}>
                            <span>{task.title}</span>
                            <button onClick={() => promoteToTodo(task.id)} className={styles.promoteBtn}>
                              <ArrowUpRight size={14} /> 宿題にする
                            </button>
                          </div>
                        ))}
                        {backlogTasks.length === 0 && <p className={styles.emptyText}>ストックはありません</p>}
                      </div>
                    </div>
                    
                    <div className={styles.taskCol}>
                      <h4>今日の宿題（アサイン済）</h4>
                      <div className={styles.teacherTaskList}>
                        {todoTasks.filter(t => t.project === selectedGoalTitle).map(task => (
                          <div key={task.id} className={`${styles.teacherTaskCard} ${styles.assignedCard}`}>
                            <span>{task.title}</span>
                            <button onClick={() => revertToBacklog(task.id)} className={styles.promoteBtn} style={{ color: 'var(--accent-danger)', background: 'rgba(239, 68, 68, 0.15)' }}>
                              <X size={14} /> 取り消す
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </motion.div>
        ) : (
          /* ================= STUDENT MODE UI ================= */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.studentContainer}>
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${activeTab === "todo" ? styles.activeTab : ""}`} onClick={() => setActiveTab("todo")}>
                未着手 <span className={styles.countBadge}>{todoTasks.length}</span>
              </button>
              <button className={`${styles.tab} ${activeTab === "done" ? styles.activeTab : ""}`} onClick={() => setActiveTab("done")}>
                完了 <span className={styles.countBadge}>{doneTasks.length}</span>
              </button>
            </div>

            <div className={styles.taskList}>
              <AnimatePresence>
                {activeTab === "todo" && todoTasks.map(task => (
                  <TaskCard key={task.id} task={task} onComplete={() => updateTaskStatus(task.id, "done")} onClick={() => toggleExecuting(task.id)} />
                ))}

                {activeTab === "done" && doneTasks.map(task => (
                  <motion.div key={task.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={styles.doneTaskCard}>
                    <div>
                      <h3 className={styles.taskTitleStriked}>{task.title}</h3>
                      <p className={styles.taskGoalText}>{task.project}</p>
                    </div>
                    <button onClick={() => updateTaskStatus(task.id, "todo")} className={styles.revertBtn}>戻す</button>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {activeTab === "todo" && todoTasks.length === 0 && (
                <div className={styles.emptyState}>
                  <CheckCircle2 size={48} className={styles.emptyIcon} />
                  <p>今日の宿題はすべて完了しました！<br/>お疲れ様です。</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Checkbox Task Component
function TaskCard({ task, onComplete, onClick }) {
  const handleCheck = (e) => {
    e.stopPropagation();
    onComplete();
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`${styles.studentTaskCard} ${task.isExecuting ? styles.executingCard : ""}`} onClick={onClick}>
      <button className={styles.checkboxBtn} onClick={handleCheck} aria-label="完了にする"></button>
      <div className={styles.taskContent} style={{ flex: 1 }}>
        <div className={styles.taskGoalText}>{task.project}</div>
        <h3 className={styles.taskTitle}>{task.title}</h3>
      </div>
      {task.isExecuting && (
        <div className={styles.executingBadge}>
          <span className={styles.pulseDot} /> 実行中
        </div>
      )}
    </motion.div>
  );
}
