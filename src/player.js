import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Raycaster, Vector3 } from 'three';
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

const Player = (props) => {
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

  const raycaster = new Raycaster();
  const rays = [new Vector3(0, 0, 1), new Vector3(1, 0, 1), new Vector3(1, 0, 0), new Vector3(1, 0, -1), new Vector3(0, 0, -1), new Vector3(-1, 0, -1), new Vector3(-1, 0, 0), new Vector3(-1, 0, 1)];

  useFrame(({ camera, clock }) => {
    // get the camera to follow the player by updating x and z coordinates
    camera.position.setX(ref.current.position.x);
    camera.position.setZ(ref.current.position.z + CAMERA_Z_DISTANCE_FROM_PLAYER);

    // find the players direction
    frontVector.set(0, 0, Number(backward) - Number(forward));
    sideVector.set(Number(left) - Number(right), 0, 0);
    direction.subVectors(frontVector, sideVector);

    if (direction.x !== 0 || direction.y !== 0 || direction.z !== 0) {
      // create a target point just ahead of the player in the direction they should be moving
      target.addVectors(ref.current.position, direction);
      // rotate the player character to look at the target point
      ref.current.lookAt(target);
    }

    let isXEnabled = true;
    let isZEnabled = true;
    // for (let i = 0; i < rays.length; i += 1) {
    //   raycaster.set(ref.current.position, rays[i]);
    //   const intersects = raycaster.intersectObjects(ref.current.parent.children);
    //   if (intersects.length > 0 && intersects[0].object.name !== 'fox' && intersects[0].distance < 3) {
    //     if ((i === 0 || i === 1 || i === 7) && direction.z === 1) {
    //       isZEnabled = false;
    //     } else if ((i === 3 || i === 4 || i === 5) && direction.z === -1) {
    //       isZEnabled = false;
    //     }
    //     if ((i === 1 || i === 2 || i === 3) && direction.x === 1) {
    //       isXEnabled = false;
    //     } else if ((i === 5 || i === 6 || i === 7) && direction.x === -1) {
    //       isXEnabled = false;
    //     }
    //   }
    // }

    raycaster.set(ref.current.position, direction);
    const intersects = raycaster.intersectObjects(ref.current.parent.children);
    if (intersects.length > 0 && intersects[0].object.name !== 'fox' && intersects[0].distance < 3) {
      if (direction.z === 1 || direction.z === -1) {
        isZEnabled = false;
      }
      if (direction.x === 1 || direction.x === -1) {
        isXEnabled = false;
      }
    }

    // add the SPEED to the players positional coordinates based on controls
    if (direction.x !== 0 || direction.z !== 0) {
      let x = ref.current.position.x;
      let z = ref.current.position.z;
      if (right) x += SPEED;
      if (left) x -= SPEED;
      if (forward) z -= SPEED;
      if (backward) z += SPEED;
      isXEnabled && ref.current.position.setX(x);
      isZEnabled && ref.current.position.setZ(z);
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
