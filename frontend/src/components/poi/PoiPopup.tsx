import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import PoiIconScene from "./PoiIconScene";
import { POI_ENTER_MS, type PoiPopupData } from "../../lib/poiPopup";

interface Props {
  data: PoiPopupData | null;
  onClose: () => void;
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function PoiPopup({ data, onClose }: Props) {
  useEffect(() => {
    if (!data) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [data, onClose]);

  return (
    <AnimatePresence>
      {data && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-6">
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          <motion.div
            className="relative glass rounded-2xl p-6 shadow-card w-full max-w-sm"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: POI_ENTER_MS / 1000, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 text-tertiary hover:text-primary transition"
            >
              <CloseIcon />
            </button>

            <div className="h-40 -mt-2 -mx-2 mb-2">
              <Canvas
                camera={{ position: [0, 0, 3], fov: 40 }}
                dpr={[1, 1.6]}
                gl={{ alpha: true, antialias: true }}
              >
                <PoiIconScene kind={data.kind} accentColor={data.accentColor} active={data !== null} />
              </Canvas>
            </div>

            <h3 className="font-display font-semibold text-lg">{data.title}</h3>
            {data.subtitle && <p className="text-sm text-tertiary mt-1">{data.subtitle}</p>}

            {data.rows.length > 0 && (
              <div className="mt-4 pt-4 border-t border-subtle space-y-2">
                {data.rows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="text-xs uppercase tracking-wide text-tertiary">{row.label}</span>
                    <span className="text-secondary font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
