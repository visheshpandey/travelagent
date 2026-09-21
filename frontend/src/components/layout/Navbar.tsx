import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../../lib/auth";
import LoginButton from "../auth/LoginButton";

function PlaneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-ember shrink-0">
      <path
        d="M21 3L3 10.5l6.5 2.5M21 3L14 21l-2.5-8.5M21 3L9.5 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

const NAV_LINKS = [
  { href: "#plan", label: "Plan" },
  { href: "#itinerary", label: "Itinerary" },
  { href: "#dashboard", label: "Dashboard" },
  { href: "#faq", label: "FAQ" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pt-4 px-4">
      <nav className="glass rounded-full px-6 py-3 flex items-center gap-8 shadow-card w-full max-w-fit">
        <div className="flex items-center gap-2">
          <PlaneIcon />
          <span className="font-display font-semibold tracking-wide text-sm">
            <span className="text-primary">Travel</span>
            <span className="text-ember">Pilot</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-xs text-secondary font-medium">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-primary transition-colors">
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {user.picture && (
                <img
                  src={user.picture}
                  alt={`${user.name}'s profile photo`}
                  className="w-6 h-6 rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="hidden sm:inline text-xs text-secondary font-medium">{user.name.split(" ")[0]}</span>
              <button onClick={logout} className="text-xs text-tertiary hover:text-primary transition-colors">
                Sign out
              </button>
            </>
          ) : (
            <LoginButton />
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="md:hidden text-secondary hover:text-primary transition-colors"
          >
            <MenuIcon open={mobileOpen} />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="glass rounded-2xl mt-2 px-6 py-4 shadow-card flex flex-col gap-3 md:hidden"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm text-secondary hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
