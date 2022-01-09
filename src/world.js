import { Suspense, useRef, memo, useState, useEffect } from 'react';
import { Player } from './player';
import { Ground } from './ground';
import { OrangeTree } from './orangeTree';
import { Loader } from './loader';

import { RemotePlayer } from './remotePlayer';

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

        // remote players
        let players = Object.keys(allPlayers)
          .filter((id) => id !== userId)
          .map((key, index) => {
            const playerData = allPlayers[key];
            return <RemotePlayer key={index} moving={playerData.moving} position={playerData.position} rotation={playerData.rotation} />;
          });

        if (players.length > 0) {
          setRemotePlayers(players);
        }
      });
    }
  }, [socketClient, userId]);

  useEffect(() => {
    if (socketClient) {
      socketClient.on('players', (allPlayers) => {
        let remotePlayers = Object.keys(allPlayers)
          .map((key, index) => {
            if (allPlayers[key].id === userId) return null; // ignore your player data in server update
            const playerData = allPlayers[key];
            return <RemotePlayer key={index} moving={playerData.moving} position={playerData.position} rotation={playerData.rotation} />;
          })
          .filter((item) => item !== null);

        if (remotePlayers.length > 0) {
          setRemotePlayers(remotePlayers);
        }
      });
    }
  }, [userId, socketClient]);

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
        <Ground width={worldData.width * 2} height={worldData.height * 2} />
      </Suspense>
    </>
  );
});