import { usePlane } from '@react-three/cannon';

export const Ground = (props) => {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], ...props }));

  return (
    <mesh ref={ref} receiveShadow {...props} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[100, 100]} rotation={[-Math.PI / 2, 0, 0]} />
      <meshStandardMaterial color={0x7cfc00} />
    </mesh>
  );
};
