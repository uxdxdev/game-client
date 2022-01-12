import { Suspense, useRef, memo, useState, useEffect, useMemo } from 'react';
import { Player } from './player';
import { OrangeTree } from './orangeTree';
import { House } from './house';
import { Loader } from './loader';
import { RemotePlayer } from './remotePlayer';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

const CLIENT_SERVER_POSITION_DIFF = 0.2;
const CAMERA_Z_DISTANCE_FROM_PLAYER = 40;
const keys = {
  KeyW: 'forward',
  KeyS: 'backward',
  KeyA: 'left',
  KeyD: 'right',
};

const updateAngleByRadians = (angle, radians) => {
  return radians - angle;
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

const runCollisionDetection = (playerData, world) => {
  const playerBBoxRotated = getRotatedRectangle(playerData.rotation, playerData.position, world.playerBoundingBox);

  const worldObjects = world.objects;
  for (const worldObject of worldObjects) {
    const objectBBoxRotated = getRotatedRectangle(worldObject.rotation, { x: worldObject.x, z: worldObject.z }, worldObject.bbox);
    if (doPolygonsIntersect(playerBBoxRotated, objectBBoxRotated)) {
      // end the loop and signal a collision
      return true;
    }
  }

  return false;
};

const getRotatedRectangle = (angle, objCenter, bbox) => {
  let bl = rotatePoint(angle, objCenter.x, objCenter.z, objCenter.x + bbox.bl.x, objCenter.z + bbox.bl.z);
  let br = rotatePoint(angle, objCenter.x, objCenter.z, objCenter.x + bbox.br.x, objCenter.z + bbox.br.z);
  let fr = rotatePoint(angle, objCenter.x, objCenter.z, objCenter.x + bbox.fr.x, objCenter.z + bbox.fr.z);
  let fl = rotatePoint(angle, objCenter.x, objCenter.z, objCenter.x + bbox.fl.x, objCenter.z + bbox.fl.z);
  return [bl, br, fr, fl];
};

const rotatePoint = (angle, cx, cz, px, pz) => {
  let x = px;
  let z = pz;
  x -= cx;
  z -= cz;
  let newX = x * Math.cos(angle) - z * Math.sin(angle);
  let newZ = x * Math.sin(angle) + z * Math.cos(angle);
  x = newX + cx;
  z = newZ + cz;
  return {
    x,
    z,
  };
};

const doPolygonsIntersect = (a, b) => {
  var polygons = [a, b];
  var minA, maxA, projected, i, i1, j, minB, maxB;

  for (i = 0; i < polygons.length; i++) {
    // for each polygon, look at each edge of the polygon, and determine if it separates
    // the two shapes
    var polygon = polygons[i];
    for (i1 = 0; i1 < polygon.length; i1++) {
      // grab 2 vertices to create an edge
      var i2 = (i1 + 1) % polygon.length;
      var p1 = polygon[i1];
      var p2 = polygon[i2];

      // find the line perpendicular to this edge
      var normal = { x: p2.z - p1.z, z: p1.x - p2.x };

      minA = maxA = undefined;
      // for each vertex in the first shape, project it onto the line perpendicular to the edge
      // and keep track of the min and max of these values
      for (j = 0; j < a.length; j++) {
        projected = normal.x * a[j].x + normal.z * a[j].z;
        if (isUndefined(minA) || projected < minA) {
          minA = projected;
        }
        if (isUndefined(maxA) || projected > maxA) {
          maxA = projected;
        }
      }

      // for each vertex in the second shape, project it onto the line perpendicular to the edge
      // and keep track of the min and max of these values
      minB = maxB = undefined;
      for (j = 0; j < b.length; j++) {
        projected = normal.x * b[j].x + normal.z * b[j].z;
        if (isUndefined(minB) || projected < minB) {
          minB = projected;
        }
        if (isUndefined(maxB) || projected > maxB) {
          maxB = projected;
        }
      }

      // if there is no overlap between the projects, the edge we are looking at separates the two
      // polygons, and we know there is no overlap
      if (maxA < minB || maxB < minA) {
        return false;
      }
    }
  }
  return true;
};

const isUndefined = (value) => {
  return value === undefined;
};

const sendPlayerData = ({ socketClient, userId, controls: { forward, backward, left, right } }) => {
  if (socketClient) {
    const playerData = { id: userId, controls: { forward, backward, left, right } };
    socketClient.emit('player_update', playerData);
  }
};

export const World = memo(({ userId, socketClient, worldData }) => {
  const playerRef = useRef();
  const last = useRef(0);
  const [remotePlayers, setRemotePlayers] = useState([]);
  const { forward, backward, left, right } = usePlayerControls();
  const moving = forward || backward || left || right;
  let now = 0;
  const PLAYER_SPEED = 0.2; // player speed for interpolation
  let millisecondsPerTick = 33; // client tick rate for sending data to server
  let tickRate = millisecondsPerTick / 1000;
  const frontVector = new Vector3();
  const sideVector = new Vector3();
  const direction = new Vector3();

  const { trees, houses } = useMemo(() => {
    const trees = worldData.objects.filter((obj) => obj.type === 'tree').map(({ x, z, rotation }, index) => <OrangeTree key={index} position={{ x, z }} rotation={rotation} />);
    const houses = worldData.objects.filter((obj) => obj.type === 'house').map(({ x, z, rotation }, index) => <House key={index} position={{ x, z }} rotation={rotation} />);
    return { trees, houses };
  }, [worldData]);

  useEffect(() => {
    if (socketClient) {
      socketClient.on('players', (allPlayers) => {
        // main player
        const posX = allPlayers[userId].position.x;
        const posZ = allPlayers[userId].position.z;

        // interpolation
        // correct the players position based on the server data
        if (Math.abs(playerRef.current.position.x - posX) > CLIENT_SERVER_POSITION_DIFF || Math.abs(playerRef.current.position.z - posZ) > CLIENT_SERVER_POSITION_DIFF) {
          console.log('correcting player position...');
          playerRef.current.position.lerp(new Vector3(posX, 0, posZ), 0.2);
        }

        // if a GLB model is not facing the X positive axis (to the right) we need to rotate it
        // so that our collision detection from the server works because it's based on a direction
        // value in radians of 0 pointing parallel to the positive X axis, see Math.atan2()
        // player fox model currently facing Z positive, which means it needs to be updated to face X positive
        const modelRotation = updateAngleByRadians(allPlayers[userId].rotation, Math.PI / 2);
        playerRef.current.rotation.set(0, modelRotation, 0);

        // remote players
        let players = Object.keys(allPlayers)
          .filter((id) => id !== userId)
          .map((key, index) => {
            const playerData = allPlayers[key];
            const moving = playerData.controls.left || playerData.controls.right || playerData.controls.forward || playerData.controls.backward;
            const updatedRotation = updateAngleByRadians(playerData.rotation, Math.PI / 2);
            return <RemotePlayer key={index} moving={moving} position={[playerData.position.x, playerData.position.y, playerData.position.z]} rotation={updatedRotation} />;
          });

        if (players.length > 0) {
          setRemotePlayers(players);
        }
      });
    }
  }, [socketClient, userId]);

  useFrame(({ camera, clock }) => {
    frontVector.set(0, 0, Number(backward) - Number(forward));
    sideVector.set(Number(left) - Number(right), 0, 0);
    direction.subVectors(frontVector, sideVector);
    const rotation = Math.atan2(direction.z, direction.x);

    const isPlayerColliding = runCollisionDetection({ position: playerRef.current.position, rotation }, worldData);
    // interpolation
    if (!isPlayerColliding) {
      if (left) playerRef.current.position.x -= PLAYER_SPEED;
      if (right) playerRef.current.position.x += PLAYER_SPEED;
      if (forward) playerRef.current.position.z -= PLAYER_SPEED;
      if (backward) playerRef.current.position.z += PLAYER_SPEED;
    }

    const modelRotation = updateAngleByRadians(rotation, Math.PI / 2);
    playerRef.current.rotation.set(0, modelRotation, 0);

    // get the camera to follow the player by updating x and z coordinates
    camera.position.setX(playerRef.current.position.x);
    camera.position.setZ(playerRef.current.position.z + CAMERA_Z_DISTANCE_FROM_PLAYER);

    // run this block at tickRate
    now = clock.getElapsedTime();
    if (now - last.current >= tickRate) {
      // send player position to server
      sendPlayerData({
        socketClient,
        userId,
        controls: {
          forward,
          backward,
          left,
          right,
        },
      });
      // reset the elapsed time if it goes over our tickrate
      last.current = now;
    }
  });

  return (
    <>
      <ambientLight />
      <directionalLight castShadow position={[40, 40, 40]} shadow-camera-left={-40 * 2} shadow-camera-right={40 * 2} shadow-camera-top={40 * 2} shadow-camera-bottom={-40 * 2} />
      <Suspense fallback={<Loader />}>
        <Player ref={playerRef} moving={moving} />
        {remotePlayers}
        {trees}
        {houses}
      </Suspense>
    </>
  );
});
