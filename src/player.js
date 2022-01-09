import React, { useEffect, useRef, useState, useCallback, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { Fox } from './fox';

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

export const Player = forwardRef((props, ref) => {
  const last = useRef(0);
  const { forward, backward, left, right } = usePlayerControls();
  const moving = forward || backward || left || right;

  const { socketClient, userId } = props;

  const frontVector = new Vector3();
  const sideVector = new Vector3();
  const direction = new Vector3();
  const target = new Vector3();

  let now = 0;
  // todo: experiment with different update tick rates on client and server
  let millisecondsPerTick = 33; // update times per second
  let tickRate = millisecondsPerTick / 1000;

  const sendPlayerData = useCallback(() => {
    if (socketClient) {
      const playerData = { id: userId, controls: { forward, backward, left, right } };
      socketClient.emit('player_update', playerData);
    }
  }, [socketClient, userId, forward, backward, left, right]);

  // on mount send player coordinates
  useEffect(() => {
    sendPlayerData();
  }, [sendPlayerData]);

  useFrame(({ camera, clock }) => {
    // get the camera to follow the player by updating x and z coordinates
    camera.position.setX(ref.current.position.x);
    camera.position.setZ(ref.current.position.z + CAMERA_Z_DISTANCE_FROM_PLAYER);

    // find the players direction and rotate
    frontVector.set(0, 0, Number(backward) - Number(forward));
    sideVector.set(Number(left) - Number(right), 0, 0);
    direction.subVectors(frontVector, sideVector);

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
});
