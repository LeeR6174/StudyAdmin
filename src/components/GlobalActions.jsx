"use client";

import { useState } from "react";
import { Settings, UserCog, Lock, X } from "lucide-react";
import { useAppContext } from "@/context/AppProvider";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import styles from "@/app/page.module.css"; 

export default function GlobalActions() {
  const { isTeacherMode, toggleTeacherMode } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setErrorMsg("");
    if (val.length === 3) {
      if (toggleTeacherMode(val)) {
        setShowPasswordDialog(false);
        setPassword("");
      } else {
        setErrorMsg("パスワードが違います");
      }
    }
  };

  const handleToggleMode = (e) => {
    e.preventDefault();
    if (isTeacherMode) {
      toggleTeacherMode();
    }
  };

  return (
    <>
      <div style={{ position: 'fixed', top: '24px', right: '20px', zIndex: 100, display: 'flex', gap: '12px', alignItems: 'center' }}>
        {pathname === "/feedback" ? (
          <button onClick={() => router.back()} className={styles.iconBtn} style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', borderRadius: '50%', padding: '10px' }}>
            <Settings size={22} color="var(--accent-primary)" />
          </button>
        ) : (
          <Link href="/feedback" className={styles.iconBtn} style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', borderRadius: '50%', padding: '10px' }}>
            <Settings size={22} />
          </Link>
        )}
        <button 
          className={styles.iconBtn} 
          onClick={() => isTeacherMode ? toggleTeacherMode() : setShowPasswordDialog(true)}
          style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', borderRadius: '50%', padding: '10px' }}
        >
          {isTeacherMode ? <UserCog size={22} color="var(--accent-primary)" /> : <Lock size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {showPasswordDialog && (
          <motion.div className={styles.dialogOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className={styles.dialogCard} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
              <div className={styles.dialogHeader}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>先生モード</h3>
                <button onClick={() => setShowPasswordDialog(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleToggleMode}>
                <input type="password" inputMode="numeric" pattern="[0-9]*" value={password} onChange={handlePasswordChange} placeholder="パスワード (555)" className={styles.input} autoFocus />
                {errorMsg && <p className={styles.error}>{errorMsg}</p>}
                <button type="submit" className={styles.primaryBtn}>ロック解除</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
