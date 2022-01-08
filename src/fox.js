import React, { forwardRef, useEffect, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';

export const Fox = forwardRef((props, ref) => {
  const { scene, materials, animations } = useGLTF('/Fox.glb');
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes } = useGraph(clone);
  const { moving } = props;
  const { actions } = useAnimations(animations, ref);

  useEffect(() => {
    if (moving) {
      actions.Survey.stop();
      actions.Run.play();
    } else {
      actions.Run.stop();
      actions.Survey.play();
    }
  }, [actions, moving]);

  return (
    <group ref={ref} {...props} dispose={null} scale={[0.04, 0.04, 0.04]}>
      {/* use a group to position mesh relative to its parent physics shape */}
      <group position={[0, -10, 0]}>
        <primitive object={nodes._rootJoint} />
        <skinnedMesh geometry={nodes.fox.geometry} material={materials.fox_material} skeleton={nodes.fox.skeleton} castShadow receiveShadow />
      </group>
    </group>
  );
});

useGLTF.preload('/Fox.glb');
