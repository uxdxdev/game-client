import { Suspense, useRef, memo, useState, useEffect } from 'react';
import { Player } from './player';
import { Ground } from './ground';
import { OrangeTree } from './orangeTree';
import { Loader } from './loader';

import { RemotePlayer } from './remotePlayer';

const updateAngleByRadians = (angle, radians) => {
  return radians - angle;
};

export const World = memo(({ userId, socketClient, worldData }) => {
  const playerRef = useRef();
  const [remotePlayers, setRemotePlayers] = useState([]);

  useEffect(() => {
    if (socketClient) {
      socketClient.on('players', (allPlayers) => {
        // main player
        const posX = allPlayers[userId].position.x;
        const posZ = allPlayers[userId].position.z;
        playerRef.current.position.x = posX;
        playerRef.current.position.z = posZ;
        // if a GLB model is not facing the X positive axis (to the right) we need to rotate it
        // so that our collision detection from the server works because it's based on a direction
        // value in radians of 0 pointing parallel to the positive X axis, see Math.atan2()
        let modelRotation = updateAngleByRadians(allPlayers[userId].rotation, Math.PI / 2);

        playerRef.current.rotation.set(0, modelRotation, 0);

        // remote players
        let players = Object.keys(allPlayers)
          .filter((id) => id !== userId)
          .map((key, index) => {
            const playerData = allPlayers[key];
            const moving = playerData.controls.left || playerData.controls.right || playerData.controls.forward || playerData.controls.backward;
            const modelRotation = updateAngleByRadians(playerData.rotation, Math.PI / 2);
            return <RemotePlayer key={index} moving={moving} position={[playerData.position.x, playerData.position.y, playerData.position.z]} rotation={[0, modelRotation, 0]} />;
          });

        if (players.length > 0) {
          setRemotePlayers(players);
        }
      });
    }
  }, [socketClient, userId]);

  return (
    <>
      <ambientLight />
      <directionalLight castShadow position={[40, 40, 40]} shadow-camera-left={-40 * 2} shadow-camera-right={40 * 2} shadow-camera-top={40 * 2} shadow-camera-bottom={-40 * 2} />
      <Suspense fallback={<Loader />}>
        <Player userId={userId} ref={playerRef} socketClient={socketClient} />
        {remotePlayers}
        {/* trees */}
        {worldData.objects
          .filter((obj) => obj.name === 'tree')
          .map(({ x, z, rotation }, index) => (
            <OrangeTree key={index} position={{ x, z }} rotation={rotation} />
          ))}
        {/* extend the width and height of the ground material based on the world dimensions to avoid seeing the edges of the material */}
        <Ground width={worldData.width} height={worldData.height} />
      </Suspense>
    </>
  );
});
