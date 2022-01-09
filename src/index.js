import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { useAuth } from './auth';
import { useNetwork } from './network';
import { World } from './world';

import './styles.css';

const generatePositions = () => {
  const positions = [];
  for (let i = 0; i < 50; i++) {
    const randX = Math.ceil(Math.random() * 50) * (Math.round(Math.random()) ? 1 : -1);
    const randZ = Math.ceil(Math.random() * 50) * (Math.round(Math.random()) ? 1 : -1);
    const position = { name: 'tree', bbox: 10, x: randX, z: randZ, rotation: Math.random() * (Math.PI - 0.0) + 0.0 };
    positions.push(position);
  }
  console.log(JSON.stringify(positions));
};

const App = () => {
  const [worldData, setWorldData] = useState();
  const { authToken, login, logout, userId } = useAuth();
  const { socketClient, isServerAuthed, handleSocketReconnect, handleSocketDisconnect } = useNetwork();

  // once authenticated, ping the server to check if it's up
  useEffect(() => {
    if (authToken) {
      fetch(`${process.env.REACT_APP_SERVER_URL}/ping`).catch((err) => console.log(err));
    }
  }, [authToken]);

  // get world data from server
  useEffect(() => {
    if (authToken) {
      fetch(`${process.env.REACT_APP_SERVER_URL}/world`)
        .then((res) => res.json())
        .then((data) => setWorldData(data.worldData))
        .catch((err) => console.log(err));
    }
  }, [authToken]);

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
        <div style={{ position: 'absolute', bottom: 0, left: 0, zIndex: 100 }}>{userId}</div>
      </header>
      {/* see styles.css for canvas-container styling  */}
      <div id="canvas-container">
        <Canvas shadows orthographic camera={{ zoom: 40, position: [0, 40, 40] }}>
          {worldData && <World worldData={worldData} userId={userId} socketClient={socketClient} />}
        </Canvas>
      </div>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
