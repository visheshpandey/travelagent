import { Canvas } from "@react-three/fiber";
import TerrainBannerScene from "./TerrainBannerScene";

export interface TerrainBannerSegment {
  label: string;
  value: number;
  color?: string;
}

interface Props {
  seed: number;
  segments: TerrainBannerSegment[];
  disrupted?: boolean;
}

export default function TerrainBanner({ seed, segments, disrupted }: Props) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden mb-6 h-56"
      style={{
        background:
          "linear-gradient(180deg,#3a2440 0%,#7a3f3a 45%,#c97a4a 75%,#e8a765 100%)",
      }}
    >
      <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
        <Canvas
          camera={{ position: [0, 4, 11], fov: 50 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true }}
          onCreated={({ camera }) => camera.lookAt(0, -0.3, 0)}
        >
          <TerrainBannerScene seed={seed} segments={segments} disrupted={disrupted} />
        </Canvas>
      </div>
    </div>
  );
}
