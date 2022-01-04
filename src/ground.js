import { usePlane } from '@react-three/cannon';
// import { useLoader } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
// import grass from './assets/grass.jpeg';

export const Ground = (props) => {
  const [ref] = usePlane(() => ({ mass: 0, rotation: [-Math.PI / 2, 0, 0], ...props }));
  // const texture = useLoader(THREE.TextureLoader, grass);
  // texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  useEffect(() => {
    const vertex = new THREE.Vector3();
    let position = ref.current.geometry.attributes.position;
    for (let i = 0, l = position.count; i < l; i++) {
      vertex.fromBufferAttribute(position, i);
      vertex.z = Math.random() * 0.5;
      position.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
  }, [ref]);

  return (
    // <mesh ref={ref} receiveShadow {...props}>
    //   <planeGeometry args={[1000, 1000]} />
    //   <meshStandardMaterial map={texture} map-repeat={[250, 250]} />
    // </mesh>
    <mesh ref={ref} receiveShadow {...props}>
      <planeGeometry args={[100, 100, 50, 50]} />
      <meshStandardMaterial color={0x7cfc00} flatShading={true} metalness={0} />
    </mesh>
  );
};
