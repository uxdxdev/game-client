import React, { forwardRef, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';

export const OrangeTree = forwardRef(({ position }, ref) => {
  const { scene, materials } = useGLTF('/Orange tree.glb');
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes } = useGraph(clone);

  return (
    <group ref={ref} dispose={null}>
      <mesh position={position} castShadow receiveShadow geometry={nodes.OrangeTree.geometry} material={materials.OrangeTree_mat} name="tree" />
    </group>
  );
});

useGLTF.preload('/Orange tree.glb');
