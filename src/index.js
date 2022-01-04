import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import './styles.css';
import { Canvas } from '@react-three/fiber';
import { Player } from './player';
import { Ground } from './ground';
import { useAuth } from './auth';
import { useNetwork } from './network';
import { Debug, Physics } from '@react-three/cannon';
import { RemotePlayer } from './remotePlayer';

const DEBUG = true;

const App = () => {
  // const [color, setColor] = useState('#000000');
  const [remotePlayers, setRemotePlayers] = useState([]);

  const { authToken, login, logout, userId } = useAuth();
  const { socketClient, isServerAuthed, handleSocketReconnect, handleSocketDisconnect } = useNetwork();

  // useEffect(() => {
  //   setColor('#' + (Math.random().toString(16) + '00000').slice(2, 8));
  // }, []);

  // once authenticated, ping the server to check if it's up
  useEffect(() => {
    if (authToken) {
      fetch(`${process.env.REACT_APP_SERVER_URL}/ping`).catch((err) => console.log(err));
    }
  }, [authToken]);

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
      <div id="canvas-container">
        <Canvas shadows camera={{ position: [0, 10, 5] }}>
          {/* <Canvas shadows orthographic camera={{ zoom: 10, position: [0, 7, 5] }}> */}
          <ambientLight intensity={0.3} />
          <pointLight castShadow position={[10, 10, -10]} />
          <Physics>
            <Debug>
              <Player socketClient={socketClient} />
              {remotePlayers}
              <Ground />
            </Debug>
          </Physics>
        </Canvas>
      </div>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
