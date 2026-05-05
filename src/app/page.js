"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { Plus, Target, CheckCircle2, X, Loader2, MessageSquare, ArrowUpRight, CheckSquare, Square } from "lucide-react";
import { useAppContext } from "@/context/AppProvider";
import { motion, AnimatePresence } from "framer-motion";

export default function DeskPage() {
  const {
    isTeacherMode, showToast, isTestMode,
    tasks, tasksLoaded, recentLog,
    addTask, updateTaskStatus, promoteToTodo, revertToBacklog, toggleExecuting,
  } = useAppContext();

  const [activeTab, setActiveTab] = useState("todo");
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showDoneGoals, setShowDoneGoals] = useState(false);

  // Derive big goals from global tasks
  const bigGoals = Array.from(new Set(tasks.map(t => t.project).filter(Boolean)));

  // Persist selectedGoalTitle across navigations via localStorage
  const [selectedGoalTitle, setSelectedGoalTitle] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("studyAdmin_selectedGoal") || "";
    }
    return "";
  });

  // When tasks first load, restore or default the selected goal
  useEffect(() => {
    if (!tasksLoaded || bigGoals.length === 0) return;
    const saved = typeof window !== "undefined" ? localStorage.getItem("studyAdmin_selectedGoal") : null;
    if (saved && bigGoals.includes(saved)) {
      setSelectedGoalTitle(saved);
    } else if (!selectedGoalTitle || !bigGoals.includes(selectedGoalTitle)) {
      setSelectedGoalTitle(bigGoals[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasksLoaded]);

  const handleSetGoal = (goal) => {
    setSelectedGoalTitle(goal);
    if (typeof window !== "undefined") {
      localStorage.setItem("studyAdmin_selectedGoal", goal);
    }
  };

  const addBigGoal = async (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    if (!bigGoals.includes(newGoalTitle)) {
      await addTask({ title: `【大目標】${newGoalTitle}`, project: newGoalTitle, status: "backlog" });
      showToast(isTestMode ? "テストモード: Notionには保存されません" : "大目標を保存しました");
    }
    handleSetGoal(newGoalTitle);
    setNewGoalTitle("");
  };

  const addTaskToBacklog = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedGoalTitle) return;
    await addTask({ title: newTaskTitle, project: selectedGoalTitle, status: "backlog" });
    showToast(isTestMode ? "テストモード: Notionには保存されません" : "タスクをストックしました");
    setNewTaskTitle("");
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
        {!tasksLoaded ? (
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
                {bigGoals.filter(goal => {
                  const goalTask = tasks.find(t => t.project === goal && t.title.startsWith("【大目標】"));
                  return !goalTask || goalTask.status !== "done";
                }).map(goal => {
                  const goalTask = tasks.find(t => t.project === goal && t.title.startsWith("【大目標】"));
                  return (
                    <div key={goal} className={`${styles.goalItem} ${selectedGoalTitle === goal ? styles.selectedGoal : ""}`} onClick={() => handleSetGoal(goal)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {goalTask && (
                        <button onClick={(e) => { e.stopPropagation(); updateTaskStatus(goalTask.id, "done"); }} style={{ background: 'none', border: 'none', padding: 0, display: 'flex', color: 'var(--text-muted)' }}>
                          <Square size={16} />
                        </button>
                      )}
                      {goal}
                    </div>
                  );
                })}
              </div>

              {bigGoals.filter(goal => {
                const goalTask = tasks.find(t => t.project === goal && t.title.startsWith("【大目標】"));
                return goalTask && goalTask.status === "done";
              }).length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <button onClick={() => setShowDoneGoals(!showDoneGoals)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: 0 }}>
                    {showDoneGoals ? "完了した大目標を隠す" : `完了した大目標 (${bigGoals.filter(g => tasks.find(t => t.project === g && t.title.startsWith("【大目標】"))?.status === "done").length})`}
                  </button>
                  {showDoneGoals && (
                    <div className={styles.goalList} style={{ marginTop: '8px', opacity: 0.7 }}>
                      {bigGoals.filter(goal => {
                        const goalTask = tasks.find(t => t.project === goal && t.title.startsWith("【大目標】"));
                        return goalTask && goalTask.status === "done";
                      }).map(goal => {
                        const goalTask = tasks.find(t => t.project === goal && t.title.startsWith("【大目標】"));
                        return (
                          <div key={goal} className={`${styles.goalItem} ${selectedGoalTitle === goal ? styles.selectedGoal : ""}`} onClick={() => handleSetGoal(goal)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button onClick={(e) => { e.stopPropagation(); updateTaskStatus(goalTask.id, "todo"); }} style={{ background: 'none', border: 'none', padding: 0, display: 'flex', color: 'var(--accent-primary)' }}>
                              <CheckSquare size={16} />
                            </button>
                            <del>{goal}</del>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

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
