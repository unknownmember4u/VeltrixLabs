"use client";

import { Suspense, useMemo } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { Stage, OrbitControls } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";

function Model() {
  const obj = useLoader(OBJLoader, "/Rmk3.obj");
  const copiedObj = useMemo(() => obj.clone(), [obj]);
  // Renders the static object exactly as is. Stage will auto-scale & lock it perfectly.
  return <primitive object={copiedObj} />;
}

export default function RobotModel() {
  return (
    <div className="w-full h-full relative cursor-default pointer-events-none">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 50 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5} adjustCamera={1.2}>
            <Model />
          </Stage>
        </Suspense>
        {/* autoRotate rotates the camera perfectly around the center. */}
        <OrbitControls autoRotate autoRotateSpeed={2} enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  );
}
