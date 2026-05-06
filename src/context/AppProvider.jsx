"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const AppContext = createContext();

// Safe synchronous localStorage read (SSR-safe)
function getLocalBool(key) {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(key) === "true";
}

export function AppProvider({ children }) {
  // Initialize synchronously from localStorage to avoid race conditions
  const [isTeacherMode, setIsTeacherMode] = useState(() => getLocalBool("studyAdmin_teacherMode"));
  const [toast, setToast] = useState(null);
  const [isTestMode, setIsTestMode] = useState(() => getLocalBool("studyAdmin_testMode"));
  const [inboxCount, setInboxCount] = useState(0);

  useEffect(() => {
    const fetchInboxCount = async () => {
      if (isTestMode) {
        setInboxCount(2);
        return;
      }
      try {
        const res = await fetch("/api/inbox");
        if (res.ok) {
          const data = await res.json();
          setInboxCount(data.filter(i => !i.isCompleted).length);
        }
      } catch (e) {}
    };
    fetchInboxCount();
  }, [isTestMode]);

  const toggleTeacherMode = (password) => {
    if (isTeacherMode) {
      setIsTeacherMode(false);
      localStorage.setItem("studyAdmin_teacherMode", "false");
      return true;
    } else {
      if (password === "555") {
        setIsTeacherMode(true);
        localStorage.setItem("studyAdmin_teacherMode", "true");
        return true;
      }
      return false; // Wrong password
    }
  };

  const toggleTestMode = () => {
    setIsTestMode((prev) => {
      const next = !prev;
      localStorage.setItem("studyAdmin_testMode", next.toString());
      return next;
    });
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  // =========================================================
  // GLOBAL TASKS STATE — persists across page navigation
  // =========================================================
  const [tasks, setTasks] = useState([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [recentLog, setRecentLog] = useState(null);

  const fetchTasks = async () => {
    try {
      const [tasksRes, logsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/logs"),
      ]);
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.map(t => ({ ...t, isExecuting: false })));
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        const latestStudentLog = logsData.find(log => !log.isTeacherLog);
        if (latestStudentLog) setRecentLog(latestStudentLog);
      }
    } catch (e) {
      console.error("fetchTasks failed:", e);
    } finally {
      setTasksLoaded(true);
    }
  };

  // Fetch once on app mount — NOT on every page navigation
  useEffect(() => {
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
      setRecentLog({ date: new Date().toISOString(), type: "壁打ち", content: "テストまであと1週間。集中して頑張る！スマホは別の部屋に置くようにする。" });
      setTasksLoaded(true);
    } else {
      fetchTasks();
    }
  // Only run on first mount — isTestMode is now initialized synchronously so this runs correctly
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Global Task Actions (all optimistic) ---
  const addTask = async ({ title, project, status = "backlog" }) => {
    const tempId = `temp_${Date.now()}`;
    const newTask = { id: tempId, title, project, status, isExecuting: false };
    setTasks(prev => [...prev, newTask]);

    if (isTestMode) {
      return; // Optimistic update already applied, caller shows toast
    }
    try {
      const notionStatus = status === "todo" ? "未着手" : "未アサイン";
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, project, status: notionStatus }),
      });
      if (res.ok) {
        const created = await res.json();
        setTasks(prev => prev.map(t => t.id === tempId ? { ...created, isExecuting: false } : t));
      } else {
        throw new Error("保存に失敗しました");
      }
    } catch (e) {
      showToast(`エラー: ${e.message}`);
      setTasks(prev => prev.filter(t => t.id !== tempId));
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    const previousTasks = [...tasks];
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: newStatus, isExecuting: false } : t
    ));
    if (newStatus === "done") showToast("タスクを完了しました！");
    if (isTestMode) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
      if (!res.ok) throw new Error();
    } catch (e) {
      setTasks(previousTasks);
      showToast("更新に失敗しました");
    }
  };

  const promoteToTodo = async (taskId) => {
    const previousTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "todo" } : t));
    showToast("宿題にアサインしました");
    if (isTestMode) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: "todo" }),
      });
      if (!res.ok) throw new Error();
    } catch (e) {
      setTasks(previousTasks);
      showToast("アサインに失敗しました");
    }
  };

  const revertToBacklog = async (taskId) => {
    const previousTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "backlog" } : t));
    showToast("アサインを取り消しました");
    if (isTestMode) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: "backlog" }),
      });
      if (!res.ok) throw new Error();
    } catch (e) {
      setTasks(previousTasks);
      showToast("取り消しに失敗しました");
    }
  };

  const toggleExecuting = (taskId) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, isExecuting: !t.isExecuting } : { ...t, isExecuting: false }
    ));
  };

  // --- Edit / Delete Task ---
  const updateTaskTitle = async (taskId, newTitle) => {
    if (!newTitle.trim()) return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, title: newTitle.trim() } : t));
    if (isTestMode) return;
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, title: newTitle.trim() }),
      });
    } catch (e) {
      console.error("Failed to update title", e);
    }
  };

  const deleteTask = async (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    showToast("タスクを削除しました");
    if (isTestMode) return;
    try {
      await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId }),
      });
    } catch (e) {
      console.error("Failed to delete task", e);
    }
  };

  // Rename a big goal: updates all tasks in that project
  const renameGoal = async (oldName, newName) => {
    if (!newName.trim() || oldName === newName.trim()) return;
    const trimmed = newName.trim();
    // Capture before state update
    const affected = tasks.filter(t => t.project === oldName);
    // Optimistic update
    setTasks(prev => prev.map(t => {
      if (t.project !== oldName) return t;
      const newTitle = t.title.startsWith("【大目標】") ? `【大目標】${trimmed}` : t.title;
      return { ...t, project: trimmed, title: newTitle };
    }));
    showToast("大目標を更新しました");
    if (typeof window !== "undefined") {
      if (localStorage.getItem("studyAdmin_selectedGoal") === oldName) {
        localStorage.setItem("studyAdmin_selectedGoal", trimmed);
      }
    }
    if (isTestMode) return;
    for (const t of affected) {
      const newTitle = t.title.startsWith("【大目標】") ? `【大目標】${trimmed}` : t.title;
      try {
        await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: t.id, title: newTitle, project: trimmed }),
        });
      } catch (e) {
        console.error("Failed to rename task", e);
      }
    }
  };

  // Delete a big goal and all its tasks
  const deleteGoal = async (goalName) => {
    const affected = tasks.filter(t => t.project === goalName);
    setTasks(prev => prev.filter(t => t.project !== goalName));
    showToast(`「${goalName}」と関連タスクを削除しました`);
    if (isTestMode) return;
    for (const t of affected) {
      try {
        await fetch("/api/tasks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: t.id }),
        });
      } catch (e) {
        console.error("Failed to delete task", e);
      }
    }
  };

  return (
    <AppContext.Provider value={{
      isTeacherMode, toggleTeacherMode,
      showToast,
      isTestMode, toggleTestMode,
      inboxCount, setInboxCount,
      // Global task state
      tasks, setTasks, tasksLoaded, recentLog,
      fetchTasks,
      addTask, updateTaskStatus, promoteToTodo, revertToBacklog, toggleExecuting,
      updateTaskTitle, deleteTask, renameGoal, deleteGoal,
    }}>
      {children}
      
      {/* Global Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            style={{
              position: "fixed",
              bottom: "80px",
              left: "50%",
              zIndex: 9999,
              background: "rgba(16, 185, 129, 0.9)",
              color: "white",
              padding: "10px 20px",
              borderRadius: "30px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
              fontWeight: 600,
              fontSize: "0.9rem",
              backdropFilter: "blur(4px)"
            }}
          >
            <CheckCircle2 size={18} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
