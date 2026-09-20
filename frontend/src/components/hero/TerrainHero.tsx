import { Canvas } from "@react-three/fiber";
import TerrainScene from "./TerrainScene";

interface Props {
  cityName: string;
  seed: number;
  disrupted: boolean;
}

export default function TerrainHero({ cityName, seed, disrupted }: Props) {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg,#2b1d3a 0%,#5b3a3c 38%,#c97a4a 62%,#e8a765 78%,#f3c78a 100%)",
      }}
    >
      <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
        <Canvas
          camera={{ position: [0, 2.4, 14], fov: 46 }}
          dpr={[1, 1.6]}
          gl={{ alpha: true, antialias: true }}
        >
          <TerrainScene cityName={cityName} seed={seed} disrupted={disrupted} />
        </Canvas>
      </div>

      <div
        className="absolute top-24 right-8 sm:right-14 flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-sm"
        style={{ background: "rgba(20,10,14,0.35)", border: "1px solid rgba(255,248,238,0.2)" }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: disrupted ? "#ff5b4a" : "#ffe9c2",
            boxShadow: `0 0 8px ${disrupted ? "#ff5b4a" : "#ffe9c2"}`,
          }}
        />
        <span className="text-xs tracking-[0.18em] font-medium" style={{ color: "#fff8ee" }}>
          {disrupted ? "REPLANNING" : "ONLINE"} · {cityName.toUpperCase()}
        </span>
      </div>

      <div
        className="absolute right-8 sm:right-14 bottom-10 backdrop-blur-sm rounded-2xl px-5 py-4 w-64"
        style={{ background: "rgba(20,10,14,0.35)", border: "1px solid rgba(255,248,238,0.2)" }}
      >
        <p className="text-[11px] tracking-[0.14em] uppercase mb-1" style={{ color: "#ffe7bf" }}>
          Now descending on
        </p>
        <p className="font-display text-lg font-semibold" style={{ color: "#fff8ee" }}>
          {cityName}
        </p>
      </div>
    </div>
  );
}
