"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { Lock, Plus, Target, CheckCircle2, X, UserCog, Loader2, MessageSquare, ArrowUpRight } from "lucide-react";
import { useAppContext } from "@/context/AppProvider";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

export default function DeskPage() {
  const { isTeacherMode, toggleTeacherMode, showToast } = useAppContext();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
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

  // --- Teacher Actions ---
  const handleToggleMode = (e) => {
    e.preventDefault();
    if (isTeacherMode) {
      toggleTeacherMode();
    } else {
      if (toggleTeacherMode(password)) {
        setShowPasswordDialog(false);
        setPassword("");
        setErrorMsg("");
      } else {
        setErrorMsg("パスワードが違います");
      }
    }
  };

  const addBigGoal = (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    if (!bigGoals.includes(newGoalTitle)) {
      setBigGoals([...bigGoals, newGoalTitle]);
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
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: "todo" } : t));
    showToast("宿題にアサインしました");
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status: "todo" })
    });
  };

  // --- Student Actions ---
  const toggleExecuting = (taskId) => {
    if (isTeacherMode) return;
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, isExecuting: !t.isExecuting } : { ...t, isExecuting: false }
    ));
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus, isExecuting: false } : t
    ));
    if (newStatus === "done") {
      showToast("タスクを完了しました！");
    }
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

  const backlogTasks = tasks.filter(t => t.status === "backlog" && t.project === selectedGoalTitle);
  const todoTasks = tasks.filter(t => t.status === "todo");
  const doneTasks = tasks.filter(t => t.status === "done");

  return (
    <div className={`${styles.container} ${isTeacherMode ? styles.teacherModeTheme : ""}`}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{isTeacherMode ? "コーチデスク" : "今日の宿題"}</h1>
          <p className={styles.subtitle}>{isTeacherMode ? "コーチング・ループの実践" : "一つずつ確実に終わらせよう"}</p>
        </div>
        <button 
          className={styles.iconBtn} 
          onClick={() => isTeacherMode ? toggleTeacherMode() : setShowPasswordDialog(true)}
        >
          {isTeacherMode ? <UserCog size={24} className={styles.teacherIcon} /> : <Lock size={24} />}
        </button>
      </header>

      <AnimatePresence>
        {showPasswordDialog && (
          <motion.div className={styles.dialogOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className={styles.dialogCard} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
              <div className={styles.dialogHeader}>
                <h3>先生モードへ切り替え</h3>
                <button onClick={() => setShowPasswordDialog(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleToggleMode}>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="パスワードを入力 (555)" className={styles.input} autoFocus />
                {errorMsg && <p className={styles.error}>{errorMsg}</p>}
                <button type="submit" className={styles.primaryBtn}>ロック解除</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

            {/* Step 2: Big Goals */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}><Target size={18} /> Step 2: 大目標の管理</h2>
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
            </section>

            {/* Step 3: Decompose Tasks & Assign */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <CheckCircle2 size={18} /> 
                Step 3: タスク細分化と宿題アサイン
              </h2>
              {selectedGoalTitle ? (
                <>
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
                            <span className={styles.statusBadge}>未着手</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className={styles.emptyText}>先に大目標を選択してください。</p>
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
              <AnimatePresence mode="popLayout">
                {activeTab === "todo" && todoTasks.map(task => (
                  <SwipeableTask key={task.id} task={task} onComplete={() => updateTaskStatus(task.id, "done")} onClick={() => toggleExecuting(task.id)} />
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

// Swipeable Task Component
function SwipeableTask({ task, onComplete, onClick }) {
  const controls = useAnimation();

  const handleDragEnd = async (event, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > 100 || velocity > 500) {
      await controls.start({ x: "100%", opacity: 0 });
      onComplete();
    } else {
      controls.start({ x: 0, opacity: 1 });
    }
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className={styles.swipeWrapper}>
      <div className={styles.swipeBackground}>
        <CheckCircle2 size={24} />
        <span>完了にする</span>
      </div>
      <motion.div drag="x" dragDirectionLock dragConstraints={{ left: 0, right: 0 }} dragElastic={{ right: 0.5, left: 0 }} onDragEnd={handleDragEnd} animate={controls} whileTap={{ cursor: "grabbing" }} className={`${styles.studentTaskCard} ${task.isExecuting ? styles.executingCard : ""}`} onClick={onClick}>
        <div className={styles.taskContent}>
          <div className={styles.taskGoalText}>{task.project}</div>
          <h3 className={styles.taskTitle}>{task.title}</h3>
        </div>
        {task.isExecuting && (
          <div className={styles.executingBadge}>
            <span className={styles.pulseDot} /> 実行中
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
