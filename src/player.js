import React, { useEffect, useRef, useState, useCallback, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
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
    if (moving) sendPlayerData();
  }, [moving, sendPlayerData]);

  useFrame(({ camera, clock }) => {
    // get the camera to follow the player by updating x and z coordinates
    camera.position.setX(ref.current.position.x);
    camera.position.setZ(ref.current.position.z + CAMERA_Z_DISTANCE_FROM_PLAYER);

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
