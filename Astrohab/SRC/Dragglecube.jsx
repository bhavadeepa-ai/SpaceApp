import React, { useRef, useState } from 'react';
import { DragControls } from '@react-three/drei';

const DraggableCube = ({ module, onPositionChange }) => {
  const meshRef = useRef();
  const controlsRef = useRef();
  const [position, setPosition] = useState(module.position);

  const handleDrag = (event) => {
    const newPos = event.object.position.toArray();
    setPosition(newPos);
    onPositionChange(module.id, newPos);
  };

  return (
    <>
      <DragControls ref={controlsRef} onDrag={handleDrag}>
        <mesh ref={meshRef} position={position}>
          <boxGeometry args={[module.size, module.size, module.size]} />
          <meshStandardMaterial color={module.color} />
        </mesh>
      </DragControls>
    </>
  );
};

export default DraggableCube;
