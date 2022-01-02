import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import { Vector3 } from 'three';
import { useGLTF } from '@react-three/drei';

const SPEED = 5;
const keys = {
  KeyW: 'forward',
  KeyS: 'backward',
  KeyA: 'left',
  KeyD: 'right',
};
const moveFieldByKey = (key) => keys[key];

const usePlayerControls = () => {
  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });
  useEffect(() => {
    const handleKeyDown = (e) => setMovement((m) => ({ ...m, [moveFieldByKey(e.code)]: true }));
    const handleKeyUp = (e) => setMovement((m) => ({ ...m, [moveFieldByKey(e.code)]: false }));
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  return movement;
};

export const Player = (props) => {
  const ref = useRef();
  const last = useRef(0);
  const { forward, backward, left, right } = usePlayerControls();
  const { nodes, materials } = useGLTF('/Astronaut.glb');

  const { socketClient } = props;
  const [mesh, api] = useSphere(() => ({
    mass: 1,
    type: 'Dynamic',
    args: [0.01],
  }));

  const frontVector = new Vector3();
  const sideVector = new Vector3();
  const direction = new Vector3();
  const target = new Vector3();

  let now = 0;
  let moving = forward || backward || left || right;
  useFrame(({ camera, clock }) => {
    frontVector.set(0, 0, Number(backward) - Number(forward));
    sideVector.set(Number(left) - Number(right), 0, 0);
    direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(SPEED);
    api.velocity.set(direction.x, 0, direction.z);

    mesh.current.getWorldPosition(ref.current.position);

    camera.position.setX(ref.current.position.x);
    camera.position.setZ(ref.current.position.z + 5);

    target.addVectors(ref.current.position, direction.normalize());
    ref.current.lookAt(target);

    now = clock.getElapsedTime();
    if (now - last.current >= 0.05) {
      if (socketClient && moving) {
        socketClient.emit('player_update', { userId: socketClient.id, position: [...ref.current.position], rotation: { x: ref.current.rotation.x, y: ref.current.rotation.y, z: ref.current.rotation.z } });
      }
      last.current = now;
    }
  });

  return <mesh ref={ref} {...props} castShadow receiveShadow geometry={nodes.Astronaut_mesh.geometry} material={materials.Astronaut_mat} />;
};

useGLTF.preload('/Astronaut.glb');
