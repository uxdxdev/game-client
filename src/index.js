import React, { Suspense, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { useAuth } from './auth';
import { useNetwork } from './network';
import Player from './player';
import { RemotePlayer } from './remotePlayer';
import { Ground } from './ground';
import { Tree } from './tree';
import { Loader } from './loader';
import {
  Physics,
  // Debug
} from '@react-three/cannon';

import './styles.css';

const generatePositions = () => {
  const positions = [];
  for (let i = 0; i < 50; i++) {
    const randX = Math.ceil(Math.random() * 50) * (Math.round(Math.random()) ? 1 : -1);
    const randZ = Math.ceil(Math.random() * 50) * (Math.round(Math.random()) ? 1 : -1);
    const position = { x: randX, z: randZ };
    positions.push(position);
  }
  console.log(JSON.stringify(positions));
};

const treePositions = [
  { x: 39, z: -6 },
  { x: 38, z: -18 },
  { x: 40, z: -38 },
  { x: 35, z: 48 },
  { x: 13, z: -39 },
  { x: 30, z: 45 },
  { x: 13, z: 39 },
  { x: 35, z: 18 },
  { x: 2, z: 5 },
  { x: 23, z: 4 },
  { x: -11, z: 13 },
  { x: 42, z: -16 },
  { x: 46, z: -25 },
  { x: 29, z: -46 },
  { x: -46, z: -30 },
  { x: -36, z: -42 },
  { x: -22, z: -46 },
  { x: -14, z: 36 },
  { x: -2, z: 5 },
  { x: -24, z: 9 },
  { x: -16, z: -10 },
  { x: 39, z: -33 },
  { x: 43, z: -19 },
  { x: -36, z: 16 },
  { x: -13, z: 22 },
  { x: -43, z: -16 },
  { x: 27, z: 25 },
  { x: -44, z: 7 },
  { x: -46, z: -41 },
  { x: -30, z: 32 },
  { x: -28, z: -6 },
  { x: -44, z: -35 },
  { x: 4, z: 33 },
  { x: 34, z: 40 },
  { x: -24, z: 13 },
  { x: -23, z: 36 },
  { x: -44, z: 34 },
  { x: -48, z: 27 },
  { x: 47, z: 33 },
  { x: -12, z: 49 },
  { x: 10, z: 8 },
  { x: 42, z: -22 },
  { x: 25, z: -10 },
  { x: -16, z: -49 },
  { x: -48, z: 47 },
  { x: 25, z: -26 },
  { x: 33, z: -40 },
  { x: -41, z: -41 },
  { x: -6, z: 43 },
  { x: 31, z: -21 },
];
const createTrees = (positions) => {
  const trees = [];
  for (let i = 0; i < positions.length; i++) {
    trees.push(<Tree key={i} position={positions[i]} />);
  }
  return trees;
};

const App = () => {
  const [remotePlayers, setRemotePlayers] = useState([]);
  const [randomTrees, setRandomTrees] = useState([]);
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

  useEffect(() => {
    setRandomTrees(createTrees(treePositions));
  }, []);

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
          <directionalLight castShadow position={[40, 40, 40]} shadow-camera-left={-40 * 2} shadow-camera-right={40 * 2} shadow-camera-top={40 * 2} shadow-camera-bottom={-40 * 2} />
          <Suspense fallback={<Loader />}>
            <Physics>
              {/* <Debug> */}
              <Player socketClient={socketClient} />
              {remotePlayers}
              {randomTrees}
              <Ground />
              {/* </Debug> */}
            </Physics>
          </Suspense>
        </Canvas>
      </div>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
