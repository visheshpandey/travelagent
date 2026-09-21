const CONTACT_EMAIL = "visheshpandey1221@gmail.com";

export default function ContactSection() {
  return (
    <section id="contact" className="relative py-28 px-6 sm:px-10">
      <div className="max-w-3xl mx-auto glass rounded-3xl p-8 sm:p-10 shadow-card text-center">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-3">Get in touch</h2>
        <p className="text-secondary text-sm mb-8 max-w-md mx-auto">
          Found a bug, have feedback, or just want to talk about the project? Reach out directly.
        </p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="inline-flex items-center gap-2 rounded-full bg-accent text-onaccent font-semibold px-6 py-3 text-sm shadow-glow hover:brightness-110 transition"
        >
          {CONTACT_EMAIL}
        </a>
      </div>
    </section>
  );
}
