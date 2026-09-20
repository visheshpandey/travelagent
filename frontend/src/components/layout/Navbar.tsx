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

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4">
      <nav className="glass rounded-full px-6 py-3 flex items-center gap-8 shadow-card">
        <div className="flex items-center gap-2">
          <PlaneIcon />
          <span className="font-display font-semibold tracking-wide text-sm">
            <span className="text-primary">Travel</span>
            <span className="text-ember">Pilot</span>
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-xs text-secondary font-medium">
          <a href="#plan" className="hover:text-primary transition-colors">
            Plan
          </a>
          <a href="#itinerary" className="hover:text-primary transition-colors">
            Itinerary
          </a>
          <a href="#dashboard" className="hover:text-primary transition-colors">
            Dashboard
          </a>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {user.picture && (
                <img src={user.picture} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
              )}
              <span className="hidden sm:inline text-xs text-secondary font-medium">{user.name.split(" ")[0]}</span>
              <button onClick={logout} className="text-xs text-tertiary hover:text-primary transition-colors">
                Sign out
              </button>
            </>
          ) : (
            <LoginButton />
          )}
        </div>
      </nav>
    </header>
  );
}
