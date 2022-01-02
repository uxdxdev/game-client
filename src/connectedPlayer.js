import { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';

export const ConnectedPlayer = ({ position, rotation }) => {
  const ref = useRef();
  const initPosition = useRef(position);
  // load astronaut model
  const { nodes, materials } = useGLTF('/Astronaut.glb');

  const target = new Vector3(position[0], position[1], position[2]);
  useFrame(() => {
    ref.current.position.lerp(target, 0.1);
  });

  return <mesh ref={ref} position={initPosition.current} rotation={rotation} castShadow receiveShadow geometry={nodes.Astronaut_mesh.geometry} material={materials.Astronaut_mat} />;
};

useGLTF.preload('/Astronaut.glb');
