import React, { useMemo } from "react";
import { useGLTF, Text } from "@react-three/drei";
import * as THREE from "three";

export function Model({ kpi, value, visibleFloor }) {
  const minMaxValues = {
    CO2: { min: 350, max: 1200 },
    Humidity: { min: 20, max: 80 },
    Temperature: { min: 0, max: 22 },
    Occupancy: { min: 0, max: 20 },
  };
  const { min, max } = minMaxValues[kpi] || { min: 0, max: 100 };

  const { scene } = useGLTF("/SampleBuilding.gltf");

  const ballColor = useMemo(() => {
    const normalize = (value, min, max) =>
      Math.max(0, Math.min(1, (value - min) / (max - min)));
    const t = normalize(value, min, max);
    return new THREE.Color().lerpColors(
      new THREE.Color("green"),
      new THREE.Color("red"),
      t
    );
  }, [value, min, max]);

  // Helper function to get transparent material
  const getTransparentMaterial = (node) => {
    const isBall = node.name.toLowerCase().includes("ball");
    return new THREE.MeshStandardMaterial({
      color: isBall ? ballColor : "lightgray",
      transparent: true,
      opacity: 0.7,
    });
  };

  // Determine if a node should be visible based on the visibleFloor state
  const isNodeVisible = (node) => {
    const name = node.name.toLowerCase();
    if (visibleFloor === "1st") {
      return (
        name.includes("ground") ||
        node.parent?.userData?.name?.toLowerCase?.()?.includes?.("ground")
      );
    } else if (visibleFloor === "2nd") {
      return (
        name.includes("first") ||
        node.parent?.userData?.name?.toLowerCase?.()?.includes?.("first")
      );
    }
    return true; // Show all floors by default
  };

  // Traverse the scene to set visibility and materials
  scene.traverse((node) => {
    if (node.isMesh) {
      node.visible = isNodeVisible(node);
      node.material = getTransparentMaterial(node);
    }
  });

  return (
    <primitive
      object={scene}
      scale={[45, 45, 45]}
      position={[0.05, -0.2, 0]}
      // rotation={[Math.PI / 6, Math.PI / -2, 0.1]}
      rotation={[0.3, 0, 0]}
      dispose={null}
    >
      {/* Add Text as a child of the specific node if needed */}
      {scene.getObjectByName("FirstFloorBall") && (
        <Text
        position={[-0.001, 0.02, 0.02]} 
          // position={[0.05, 0.065, -0.045]} // Adjust to place text in front
          // rotation={[0, 1.56, 0]}
          fontSize={0.002}
          color="black"
          anchorX="center"
          anchorY="middle"
        >
          {value.toFixed(1)} {kpi}
        </Text>
      )}
    </primitive>
  );
}

useGLTF.preload("/SampleBuilding.gltf");
