import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { Fox } from './fox';
import { useCompoundBody } from '@react-three/cannon';

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

const Player = (props) => {
  const colliderSphere = 1;
  const currentPositionRef = useRef([0, colliderSphere, 0]);
  const currentRotationRef = useRef([0, 0, 0]);
  const [ref, api] = useCompoundBody(() => ({
    mass: 1,
    shapes: [
      { type: 'Sphere', position: [0, colliderSphere, -1.5], args: [colliderSphere] },
      { type: 'Sphere', position: [0, colliderSphere, 0], args: [colliderSphere] },
      { type: 'Sphere', position: [0, colliderSphere, 1.5], args: [colliderSphere] },
    ],
  }));

  const last = useRef(0);
  const { forward, backward, left, right } = usePlayerControls();
  const moving = forward || backward || left || right;

  const { socketClient } = props;

  const frontVector = new Vector3();
  const sideVector = new Vector3();
  const direction = new Vector3();

  let now = 0;
  let millisecondsPerTick = 50; // 20 times per second
  let tickRate = millisecondsPerTick / 1000;

  const sendPlayerData = useCallback(() => {
    if (socketClient && socketClient.id !== undefined && currentPositionRef.current && currentRotationRef.current) {
      const playerData = { moving, id: socketClient.id, position: [...currentPositionRef.current], rotation: [...currentRotationRef.current] };
      socketClient.emit('player_update', playerData);
    }
  }, [socketClient, moving]);

  // on mount send player coordinates
  useEffect(() => {
    sendPlayerData();
  }, [sendPlayerData]);

  useEffect(() => {
    const unsubscribe = api.position.subscribe((p) => (currentPositionRef.current = p));
    return unsubscribe;
  }, [api.position]);

  useEffect(() => {
    const unsubscribe = api.rotation.subscribe((r) => (currentRotationRef.current = r));
    return unsubscribe;
  }, [api.rotation]);

  useFrame(({ camera, clock }) => {
    const positionX = currentPositionRef.current[0];
    const positionZ = currentPositionRef.current[2];

    // get the camera to follow the player by updating x and z coordinates
    camera.position.setX(positionX);
    camera.position.setZ(positionZ + CAMERA_Z_DISTANCE_FROM_PLAYER);

    // add the SPEED to the players positional coordinates based on controls
    let x = positionX;
    let z = positionZ;
    if (right) x += SPEED;
    if (left) x -= SPEED;
    if (forward) z -= SPEED;
    if (backward) z += SPEED;
    // stop any velocity from collisions
    api.velocity.set(0, 0, 0);
    api.angularVelocity.set(0, 0, 0);
    // move player keeping y position set
    api.position.set(x, 1, z);

    // find the players direction and rotate
    frontVector.set(0, 0, Number(backward) - Number(forward));
    sideVector.set(Number(left) - Number(right), 0, 0);
    direction.subVectors(frontVector, sideVector);

    // only update rotation if moving
    if (moving) {
      api.rotation.set(0, Math.atan2(direction.x, direction.z), 0);
    } else {
      // correct rotation after effects of collisions
      api.rotation.set(0, currentRotationRef.current[1], 0);
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

export default React.memo(Player);
