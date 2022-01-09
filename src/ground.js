import { useRef } from 'react';

export const Ground = ({ width, height }) => {
  const ref = useRef();

  return (
    <mesh ref={ref} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial color={0x7cfc00} />
    </mesh>
  );
};
