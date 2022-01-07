import React, { Suspense, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { useAuth } from './auth';
import { useNetwork } from './network';
import Player from './player';
import { RemotePlayer } from './remotePlayer';
import { Ground } from './ground';
import Tree from './tree';
import { Loader } from './loader';

import './styles.css';

const App = () => {
  const [remotePlayers, setRemotePlayers] = useState([]);
  const { authToken, login, logout, userId } = useAuth();
  const { socketClient, isServerAuthed, handleSocketReconnect, handleSocketDisconnect } = useNetwork();

  // once authenticated, ping the server to check if it's up
  useEffect(() => {
    if (authToken) {
      fetch(`${process.env.REACT_APP_SERVER_URL}/ping`).catch((err) => console.log(err));
    }
  }, [authToken]);

  // get updates of all other players from the server
  useEffect(() => {
    if (socketClient) {
      socketClient.on('players', (allPlayers) => {
        let remotePlayers = Object.keys(allPlayers)
          .map((key, index) => {
            if (key === socketClient.id) return null; // ignore your player data in server update
            const playerData = allPlayers[key];
            return <RemotePlayer key={index} moving={playerData.moving} position={playerData.position} rotation={playerData.rotation} />;
          })
          .filter((item) => item !== null);

        setRemotePlayers(remotePlayers);
      });
    }
  }, [userId, socketClient]);

  return (
    <>
      <header>
        <div
          style={{
            backgroundColor: authToken ? 'green' : 'red',
          }}
        >
          Firebase authenticated? {authToken ? 'true' : 'false'}
        </div>
        <button onClick={login} disabled={authToken}>
          Login to Firebase
        </button>
        <button onClick={logout} disabled={authToken === null || !authToken}>
          Logout of Firebase
        </button>
        <div
          style={{
            backgroundColor: isServerAuthed ? 'green' : 'red',
          }}
        >
          Server authenticated? {isServerAuthed ? 'true' : 'false'}
        </div>
        <button onClick={handleSocketReconnect} disabled={!authToken || isServerAuthed === null || isServerAuthed}>
          Reconnect to Socket.io server
        </button>
        <button onClick={handleSocketDisconnect} disabled={!authToken || isServerAuthed === null || !isServerAuthed}>
          Disconnect from Socket.io server
        </button>
        <div style={{ position: 'absolute', bottom: 0, left: 0, zIndex: 100 }}>{socketClient?.id}</div>
      </header>
      {/* see styles.css for canvas-container styling  */}
      <div id="canvas-container">
        <Canvas shadows orthographic camera={{ zoom: 40, position: [0, 40, 40] }}>
          <ambientLight />
          <directionalLight castShadow position={[40, 40, 40]} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-40} />
          <Suspense fallback={<Loader />}>
            <Player socketClient={socketClient} />
            {remotePlayers}
            <Tree position={[1, 0, 0]} />
            <Ground />
          </Suspense>
        </Canvas>
      </div>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
