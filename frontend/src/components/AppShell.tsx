import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  ChevronDown,
  CircleHelp,
  Command,
  Download,
  LayoutDashboard,
  Menu,
  Settings2,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "show" : ""}`}>
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Command size={19} />
          </span>
          <span>
            northstar<span className="brand-dot">.</span>
          </span>
        </Link>
        <div className="workspace">
          <span className="workspace-icon">N</span>
          <span className="workspace-text">
            <b>Northstar Studio</b>
            <small>Workspace</small>
          </span>
          <ChevronDown size={15} />
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav className="nav">
          <NavLink to="/" end onClick={() => setOpen(false)}>
            <LayoutDashboard />
            Overview
          </NavLink>
          <NavLink to="/accounts" onClick={() => setOpen(false)}>
            <WalletCards />
            Accounts
          </NavLink>
          <NavLink to="/transactions" onClick={() => setOpen(false)}>
            <Activity />
            Transactions
          </NavLink>
        </nav>
        <div className="nav-label tools-label">TOOLS</div>
        <nav className="nav">
          <a href="#report">
            <Download />
            Reports
          </a>
          <a href="#settings">
            <Settings2 />
            Settings
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <CircleHelp size={18} />
            </div>
            <b>Need a hand?</b>
            <p>Our support team is just a click away.</p>
            <a href="mailto:support@example.com">
              Get in touch <ArrowRight size={14} />
            </a>
          </div>
          <button className="profile">
            <span className="avatar">AS</span>
            <span>
              <b>Alex Smith</b>
              <small>Admin account</small>
            </span>
            <ChevronDown size={15} />
          </button>
        </div>
      </aside>
      {open && (
        <button
          aria-label="Close menu"
          className="scrim"
          onClick={() => setOpen(false)}
        />
      )}
      <main className="main">
        <header className="topbar">
          <button
            className="mobile-menu icon-btn"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
          <div className="breadcrumbs">
            Workspace <span>/</span> <b>Overview</b>
          </div>
          <div className="top-actions">
            <span className="live-dot" />{" "}
            <span className="live-label">All systems operational</span>
            <button className="icon-btn" aria-label="Help">
              <CircleHelp />
            </button>
            <span className="top-avatar">AS</span>
          </div>
        </header>
        {children}
        <footer className="footer">
          <span>© {new Date().getFullYear()} Northstar Studio</span>
          <span className="footer-right">
            <ShieldCheck size={13} /> Your data is encrypted and secure <i />{" "}
            <a href="/">Privacy</a>
          </span>
        </footer>
      </main>
    </div>
  );
}
