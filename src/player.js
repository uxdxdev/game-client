import { useEffect, useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { Fox } from './fox';

const SPEED = 0.2;
const CAMERA_Z_DISTANCE_FROM_PLAYER = 40;
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

  const frontVector = new Vector3();
  const sideVector = new Vector3();
  const direction = new Vector3();
  const target = new Vector3();

  let now = 0;
  let millisecondsPerTick = 50; // 20 times per second
  let tickRate = millisecondsPerTick / 1000;

  const sendPlayerData = useCallback(() => {
    if (socketClient && socketClient.id !== undefined && ref.current.position && ref.current.rotation) {
      const playerData = { moving, id: socketClient.id, position: [...ref.current.position], rotation: [ref.current.rotation.x, ref.current.rotation.y, ref.current.rotation.z] };
      socketClient.emit('player_update', playerData);
    }
  }, [socketClient, moving]);

  // on mount send player coordinates
  useEffect(() => {
    sendPlayerData();
  }, [sendPlayerData]);

  useFrame(({ camera, clock }) => {
    // add the SPEED to the players positional coordinates based on controls
    let x = ref.current.position.x;
    let z = ref.current.position.z;
    if (right) x += SPEED;
    if (left) x -= SPEED;
    if (forward) z -= SPEED;
    if (backward) z += SPEED;
    ref.current.position.setX(x);
    ref.current.position.setZ(z);

    // get the camera to follow the player by updating x and z coordinates
    camera.position.setX(ref.current.position.x);
    camera.position.setZ(ref.current.position.z + CAMERA_Z_DISTANCE_FROM_PLAYER);

    // find the players direction
    frontVector.set(0, 0, Number(backward) - Number(forward));
    sideVector.set(Number(left) - Number(right), 0, 0);
    direction.subVectors(frontVector, sideVector).normalize();

    if (direction.x !== 0 || direction.y !== 0 || direction.z !== 0) {
      // create a target point just ahead of the player in the direction they should be moving
      target.addVectors(ref.current.position, direction);
      // rotate the player character to look at the target point
      ref.current.lookAt(target);
    }

    // run this block at tickRate
    now = clock.getElapsedTime();
    if (now - last.current >= tickRate) {
      // send player position to server
      sendPlayerData();
      // reset the elapsed time if it goes over our tickrate
      last.current = now;
    }
  });

  return <Fox ref={ref} moving={moving} />;
};
