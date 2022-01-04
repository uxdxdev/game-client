import { useEffect, useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import { Vector3 } from 'three';
import { Fox } from './fox';

const SPEED = 10;
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
  const moving = forward || backward || left || right;

  const { socketClient } = props;
  const [mesh, api] = useSphere(() => ({
    type: 'Kinematic',
  }));

  const frontVector = new Vector3();
  const sideVector = new Vector3();
  const direction = new Vector3();
  const target = new Vector3();

  let now = 0;
  let millisecondsPerTick = 50; // 20 times per second
  let tickRate = millisecondsPerTick / 1000;

  const sendPlayerData = useCallback(() => {
    if (socketClient && socketClient.id !== undefined && ref.current.position && ref.current.rotation) {
      socketClient.emit('player_update', { moving, id: socketClient.id, position: [...ref.current.position], rotation: [ref.current.rotation.x, ref.current.rotation.y, ref.current.rotation.z] });
    }
  }, [socketClient, moving]);

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
    if (now - last.current >= tickRate) {
      sendPlayerData();
      // reset the elapsed time if it goes over our tickrate
      last.current = now;
    }
  });

  // on mount send player coordinates
  useEffect(() => {
    sendPlayerData();
  }, [sendPlayerData]);

  return <Fox ref={ref} moving={moving} />;
};
