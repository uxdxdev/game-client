import { usePlane } from '@react-three/cannon';
import { useLoader } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import grass from './assets/grass.jpeg';

export const Ground = (props) => {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], ...props }));
  const texture = useLoader(THREE.TextureLoader, grass);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  useEffect(() => {
    for (let i = 0; i < ref.current?.geometry?.vertices?.length; i++) {
      ref.current.geometry.vertices[i].setZ(Math.random() * 0.5);
    }
  }, [ref]);

  return (
    <mesh ref={ref} receiveShadow {...props}>
      <planeGeometry args={[1000, 1000]} />
      <meshStandardMaterial map={texture} map-repeat={[250, 250]} />
    </mesh>
  );
};
