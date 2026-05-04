"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquarePlus, History } from "lucide-react";
import styles from "./BottomNav.module.css";

export default function BottomNav() {
  const pathname = usePathname();

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
  ];

  return (
    <nav className={`${styles.navContainer} glass-nav`}>
      <ul className={styles.navList}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <li key={item.name} className={styles.navItem}>
              <Link
                href={item.path}
                className={`${styles.navLink} ${isActive ? styles.active : ""}`}
              >
                <div className={styles.iconWrapper}>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
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
