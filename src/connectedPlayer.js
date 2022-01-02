import { useRef } from 'react';
import { useGLTF } from '@react-three/drei';

export const ConnectedPlayer = ({ position, rotation }) => {
  const ref = useRef();
  const { nodes, materials } = useGLTF('/Astronaut.glb');

  return <mesh ref={ref} position={position} rotation={[rotation.x, rotation.y, rotation.z]} castShadow receiveShadow geometry={nodes.Astronaut_mesh.geometry} material={materials.Astronaut_mat} />;
};

useGLTF.preload('/Astronaut.glb');
