"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquarePlus, History, Database } from "lucide-react";
import styles from "./BottomNav.module.css";
import { useAppContext } from "@/context/AppProvider";

export default function BottomNav() {
  const pathname = usePathname();
  const { allDbTaskCount } = useAppContext();

  const navItems = [
    {
      name: "デスク",
      path: "/",
      icon: LayoutDashboard,
    },
    {
      name: "壁打ち",
      path: "/log",
      icon: MessageSquarePlus,
    },
    {
      name: "振り返り",
      path: "/mirror",
      icon: History,
    },
    {
      name: "Inbox",
      path: "/alldb",
      icon: Database,
      badge: allDbTaskCount > 0 ? allDbTaskCount : null,
    },
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
                <div style={{ position: 'relative' }}>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  {item.badge && (
                    <span style={{ position: 'absolute', top: '-4px', right: '-8px', background: 'var(--accent-danger)', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 5px', borderRadius: '10px', lineHeight: 1 }}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={styles.label}>{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
