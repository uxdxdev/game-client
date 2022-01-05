import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { Fox } from './fox';

export const RemotePlayer = ({ position, rotation, moving }) => {
  const ref = useRef();
  const initPosition = useRef(position);

  const target = new Vector3(position[0], position[1], position[2]);
  useFrame(() => {
    ref.current.position.lerp(target, 0.2);
  });

  return <Fox ref={ref} moving={moving} position={initPosition.current} rotation={rotation} />;
};
