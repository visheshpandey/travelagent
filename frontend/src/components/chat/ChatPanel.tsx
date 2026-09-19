import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { askQuestion } from "../../lib/api";
import type { ChatMessage } from "../../lib/types";

interface Props {
  tripId: string | null;
}

export default function ChatPanel({ tripId }: Props) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!tripId || !question.trim()) return;
    const q = question.trim();
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);
    try {
      const res = await askQuestion({ trip_id: tripId, question: q });
      setMessages((prev) => [...prev, { role: "agent", text: res.answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: err instanceof Error ? err.message : "Something went wrong" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="glass rounded-2xl w-80 sm:w-96 h-[28rem] mb-4 flex flex-col shadow-card overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <p className="font-display font-semibold text-sm">Ask about your trip</p>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {!tripId && (
                <p className="text-xs text-white/40">Generate an itinerary first to ask questions about it.</p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`text-sm rounded-2xl px-3 py-2 max-w-[85%] ${
                    m.role === "user"
                      ? "bg-accent/20 text-white ml-auto rounded-br-sm"
                      : "bg-white/5 text-white/85 rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {loading && <div className="text-xs text-white/40">Thinking…</div>}
            </div>

            <form onSubmit={handleAsk} className="p-3 border-t border-white/10 flex gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={!tripId}
                placeholder="What am I doing tomorrow?"
                className="flex-1 rounded-full bg-panel border border-white/10 px-4 py-2 text-xs focus:border-accent focus:outline-none disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={!tripId || loading}
                className="rounded-full bg-accent text-ink px-4 py-2 text-xs font-semibold disabled:opacity-40"
              >
                Ask
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-full bg-accent text-ink w-14 h-14 flex items-center justify-center text-xl shadow-glow hover:brightness-110 transition"
      >
        💬
      </button>
    </div>
  );
}
