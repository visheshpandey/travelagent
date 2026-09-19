export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4">
      <nav className="glass rounded-full px-6 py-3 flex items-center gap-8 shadow-card">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent shadow-glow" />
          <span className="font-display font-semibold tracking-wide text-sm">TravelPilot</span>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-xs text-white/60 font-medium">
          <a href="#plan" className="hover:text-white transition-colors">
            Plan
          </a>
          <a href="#itinerary" className="hover:text-white transition-colors">
            Itinerary
          </a>
          <a href="#dashboard" className="hover:text-white transition-colors">
            Dashboard
          </a>
        </div>
      </nav>
    </header>
  );
}
