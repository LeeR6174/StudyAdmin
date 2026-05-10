"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, Database, LayoutDashboard, Lightbulb, PenTool } from "lucide-react";
import { motion } from "framer-motion";
import styles from "./BottomNav.module.css";
import { useAppContext } from "@/context/AppProvider";

export default function BottomNav() {
  const pathname = usePathname();
  const { inboxCount } = useAppContext();

  const navItems = [
    { name: "追加", path: "/", icon: MessageSquarePlus },
    { name: "Inbox", path: "/inbox", icon: Database, badge: inboxCount > 0 ? inboxCount : null },
    { name: "Dialogue", path: "/practice", icon: LayoutDashboard },
    { name: "思考", path: "/notes", icon: Lightbulb },
    { name: "レター", path: "/letters", icon: PenTool },
  ];

  return (
    <nav className={`${styles.navContainer} glass-nav`}>
      <ul className={styles.navList}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <li key={item.name} className={styles.navItem}>
              <Link href={item.path} className={`${styles.navLink} ${isActive ? styles.active : ""}`}>
                <motion.div 
                  whileTap={{ scale: 0.9 }}
                  style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                >
                  <div className={`${styles.iconWrapper} ${isActive ? styles.activeIcon : ""}`}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={styles.label}>{item.name}</span>
                  {item.badge && (
                    <span className={styles.badge}>
                      {item.badge}
                    </span>
                  )}
                </motion.div>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
