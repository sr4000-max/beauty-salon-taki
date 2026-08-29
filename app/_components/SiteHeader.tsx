"use client";

import Link from "next/link";
import { useState } from "react";

type Active = "home" | "menu" | "reservation" | null;

export function SiteHeader({ active = null }: { active?: Active }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: Array<{ href: string; label: string; key: Active; cta?: boolean }> = [
    { href: "/", label: "HOME", key: "home" },
    { href: "/#concept", label: "CONCEPT", key: null },
    { href: "/menus", label: "MENU", key: "menu" },
    { href: "/#access", label: "ACCESS", key: null },
    { href: "/menus", label: "RESERVATION", key: "reservation", cta: true },
  ];
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="logo">
          <img src="/logo.png" alt="Beauty Salon TAKI" className="logo-img" />
        </Link>
        <nav className="nav-pc">
          {navItems.map((n, i) => {
            const isActive = n.key && n.key === active;
            const cls = [
              "nav-link",
              n.cta ? "nav-cta" : "",
              isActive ? "active" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <Link key={i} href={n.href} className={cls}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          className={`hamburger${isMobileMenuOpen ? " open" : ""}`}
          aria-label={isMobileMenuOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
        >
          <span></span><span></span><span></span>
        </button>
      </div>
      <nav
        className={`nav-sp${isMobileMenuOpen ? " open" : ""}`}
        id="mobile-navigation"
        aria-label="モバイルナビゲーション"
      >
        <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>HOME</Link>
        <Link href="/#concept" onClick={() => setIsMobileMenuOpen(false)}>CONCEPT</Link>
        <Link href="/menus" onClick={() => setIsMobileMenuOpen(false)}>MENU</Link>
        <Link href="/#access" onClick={() => setIsMobileMenuOpen(false)}>ACCESS</Link>
        <Link href="/menus" className="nav-cta-sp" onClick={() => setIsMobileMenuOpen(false)}>RESERVATION</Link>
      </nav>
    </header>
  );
}
