import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { useAuth } from './useAuth';
import { useNetwork } from './useNetwork';
import { World } from './world';

import './styles.css';

const App = () => {
  const [worldData, setWorldData] = useState();
  const { authToken, login, logout, userId } = useAuth();
  const { socketClient, isServerAuthed } = useNetwork();

  // once authenticated, ping the server to check if it's up
  useEffect(() => {
    if (authToken) {
      fetch(`${process.env.REACT_APP_SERVER_URL}/ping`).catch((err) => console.log(err));
    }
  }, [authToken]);

  // get world data from server
  useEffect(() => {
    if (authToken) {
      fetch(`${process.env.REACT_APP_SERVER_URL}/world`, {
        headers: {
          'auth-token': authToken,
        },
      })
        .then((res) => res.json())
        .then((data) => setWorldData(data.worldData))
        .catch((err) => console.log(err));
    }
  }, [authToken]);

  return (
    <>
      {!authToken && !isServerAuthed && (
        <div id="buttons">
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
        </div>
      )}
      {/* see styles.css for canvas-container styling  */}
      <div id="canvas-container">
        <Canvas shadows orthographic camera={{ zoom: 40, position: [0, 40, 40] }}>
          {worldData && <World worldData={worldData} userId={userId} socketClient={socketClient} />}
        </Canvas>
      </div>
      <div style={{ position: 'absolute' }}>
        ping <span id="ping">0</span>ms
      </div>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
