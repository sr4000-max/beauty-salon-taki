import Link from "next/link";

type Active = "home" | "menu" | "reservation" | null;

export function SiteHeader({ active = null }: { active?: Active }) {
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
        <button className="hamburger" aria-label="menu" id="hamburger">
          <span></span><span></span><span></span>
        </button>
      </div>
      <nav className="nav-sp" id="navSp">
        <Link href="/">HOME</Link>
        <Link href="/#concept">CONCEPT</Link>
        <Link href="/menus">MENU</Link>
        <Link href="/#access">ACCESS</Link>
        <Link href="/menus" className="nav-cta-sp">RESERVATION</Link>
      </nav>
    </header>
  );
}
