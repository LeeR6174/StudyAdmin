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
              background: "rgba(56, 189, 248, 0.95)",
              color: "#0f172a",
              padding: "12px 24px",
              borderRadius: "var(--radius-full)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 8px 30px rgba(56, 189, 248, 0.3)",
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
