"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [isTeacherMode, setIsTeacherMode] = useState(false);
  const [toast, setToast] = useState(null);

  // Load state from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("studyAdmin_teacherMode");
    if (saved === "true") {
      setIsTeacherMode(true);
    }
  }, []);

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

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  return (
    <AppContext.Provider value={{ isTeacherMode, toggleTeacherMode, showToast }}>
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
