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
  const [toast, setToast] = useState(null);
  const [isTestMode, setIsTestMode] = useState(() => getLocalBool("studyAdmin_testMode"));
  const [inboxCount, setInboxCount] = useState(0);
  const [letterBadge, setLetterBadge] = useState(false);

  // Check if it's time for a weekly letter
  const checkLetterBadge = async () => {
    if (isTestMode) return;
    try {
      const res = await fetch("/api/letters");
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const lastDate = new Date(data.items[0].date);
          const diffDays = (new Date() - lastDate) / (1000 * 60 * 60 * 24);
          // If more than 13 days have passed, show a badge
          setLetterBadge(diffDays > 13);
        } else {
          // If no history, show badge as a prompt to start
          setLetterBadge(true);
        }
      }
    } catch (e) {
      console.error("Failed to check letter badge:", e);
    }
  };

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

  useEffect(() => {
    fetchInboxCount();
    checkLetterBadge();
    const interval = setInterval(() => {
      fetchInboxCount();
      checkLetterBadge();
    }, 60000);
    return () => clearInterval(interval);
  }, [isTestMode]);

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

  return (
    <AppContext.Provider value={{
      showToast,
      isTestMode, toggleTestMode,
      inboxCount, setInboxCount,
      letterBadge,
      setLetterBadge
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
              background: "rgba(99, 102, 241, 0.95)",
              color: "#ffffff",
              padding: "12px 24px",
              borderRadius: "var(--radius-full)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 8px 30px rgba(99, 102, 241, 0.15)",
              fontWeight: 800,
              fontSize: "0.95rem",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255, 255, 255, 0.1)"
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
