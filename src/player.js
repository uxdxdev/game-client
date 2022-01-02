import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import { Vector3 } from 'three';
import { useGLTF } from '@react-three/drei';

const SPEED = 5;
const CAMERA_Z_DISTANCE_FROM_PLAYER = 5;
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

  // load astronaut model
  const { nodes, materials } = useGLTF('/Astronaut.glb');

  const { socketClient } = props;
  const [mesh, api] = useSphere(() => ({
    mass: 1,
    type: 'Dynamic',
    // make the physics sphere tiny to bring the mesh close to the ground
    // todo: find a way to offset the mesh so it's closer to the ground without modifying the size of the physics sphere
    args: [0.01],
  }));

  const frontVector = new Vector3();
  const sideVector = new Vector3();
  const direction = new Vector3();
  const target = new Vector3();

  let now = 0;
  let millisecondsPerTick = 50; // 20 times per second
  let tickRate = millisecondsPerTick / 1000;
  useFrame(({ camera, clock }) => {
    // move the player when WASD are pressed
    frontVector.set(0, 0, Number(backward) - Number(forward));
    sideVector.set(Number(left) - Number(right), 0, 0);
    direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(SPEED);
    api.velocity.set(direction.x, 0, direction.z);

    // set the mesh to the same position as the physics sphere
    mesh.current.getWorldPosition(ref.current.position);

    // get the camera to follow the player
    camera.position.setX(ref.current.position.x);
    camera.position.setZ(ref.current.position.z + CAMERA_Z_DISTANCE_FROM_PLAYER);

    // rotate the player in the direction they are moving
    const normalisedDirection = direction.normalize();
    if (normalisedDirection.x !== 0 || normalisedDirection.y !== 0 || normalisedDirection.z !== 0) {
      target.addVectors(ref.current.position, normalisedDirection);
      ref.current.lookAt(target);
    }

    // send player position to server when moving
    now = clock.getElapsedTime();
    // 1 second / 20 = 0.05 i.e. 20 times per second

    if (now - last.current >= tickRate) {
      if (socketClient && socketClient.id !== undefined) {
        socketClient.emit('player_update', { id: socketClient.id, position: [...ref.current.position], rotation: [ref.current.rotation.x, ref.current.rotation.y, ref.current.rotation.z] });
      }
      // reset the elapsed time if it goes over our tickrate
      last.current = now;
    }
  });

  // on mount send player coordinates
  useEffect(() => {
    // not using "moving" because the frame rate sometimes will not send the latest player position
    if (socketClient && socketClient.id !== undefined) {
      socketClient.emit('player_update', { id: socketClient.id, position: [...ref.current.position], rotation: [ref.current.rotation.x, ref.current.rotation.y, ref.current.rotation.z] });
    }
  }, [socketClient, socketClient?.id]);

  return <mesh ref={ref} {...props} castShadow receiveShadow geometry={nodes.Astronaut_mesh.geometry} material={materials.Astronaut_mat} />;
};

useGLTF.preload('/Astronaut.glb');
