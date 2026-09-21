export default function AboutSection() {
  return (
    <section id="about" className="relative py-28 px-6 sm:px-10">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-6">About TravelPilot</h2>
        <p className="text-secondary text-base leading-relaxed mb-4">
          Most trip planners stop at the itinerary — a static list you have to manually redo the moment
          something changes. TravelPilot treats planning as a live process: it builds your day-by-day plan
          from real points of interest, then keeps rebuilding it as conditions on the ground change, whether
          that's a closed venue, bad weather, or you just changing your mind mid-trip.
        </p>
        <p className="text-secondary text-base leading-relaxed">
          It was built as a two-day hackathon project — an exploration of what a genuinely reactive trip
          copilot could look like, powered by real place data and an AI planner that explains its reasoning
          in plain language instead of just silently swapping things out.
        </p>
      </div>
    </section>
  );
}
