import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <p className="footer-logo">Beauty Salon TAKI</p>
            <p className="footer-desc">
              ビューティーサロンたき<br />
              髪と心に、やさしい時間を。<br />
              鹿児島県薩摩川内市の美容室。
            </p>
          </div>
          <div>
            <p className="footer-title">MENU</p>
            <ul>
              <li><Link href="/">HOME</Link></li>
              <li><Link href="/#concept">CONCEPT</Link></li>
              <li><Link href="/menus">MENU</Link></li>
              <li><Link href="/#access">ACCESS</Link></li>
              <li><Link href="/menus">RESERVATION</Link></li>
            </ul>
          </div>
          <div>
            <p className="footer-title">CONTACT</p>
            <p>〒895-0055<br />鹿児島県薩摩川内市<br />西開聞町1-11</p>
            <p>TEL: <a href="tel:0996-22-4342">0996-22-4342</a></p>
          </div>
        </div>
        <p className="copyright">© 2026 Beauty Salon TAKI. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
