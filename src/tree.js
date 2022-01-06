import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';

export default function Tree(props) {
  const group = useRef();
  const { nodes, materials } = useGLTF('/Orange tree.glb');
  return (
    <group ref={group} {...props} dispose={null}>
      <mesh castShadow receiveShadow geometry={nodes.OrangeTree.geometry} material={materials.OrangeTree_mat} />
    </group>
  );
}

useGLTF.preload('/Orange tree.glb');
