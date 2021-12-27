import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
} from 'firebase/auth';

// FIREBASE
const firebaseConfig = {
  apiKey: 'AIzaSyAsTVrHaqo3yj6wrKKvuCUG0pTViSa76Gg',
  authDomain: 'game-bb9e8.firebaseapp.com',
  projectId: 'game-bb9e8',
  storageBucket: 'game-bb9e8.appspot.com',
  messagingSenderId: '118076181279',
  appId: '1:118076181279:web:d96c9b95e192513e083e2a',
};

initializeApp(firebaseConfig);

// FIREBASE AUTH
const auth = getAuth();

const events = {
  NUMBER_OF_CONNECTED_CLIENTS: 'number_of_connected_clients',
  CONNECTED: 'connected',
  CONNECTION_ERROR: 'connect_error',
};

const App = () => {
  const [socketClient, setSocketClient] = useState(null);
  const [numberOfClients, setNumberOfClients] = useState(0);
  const [authToken, setAuthToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isServerAuthed, setIsServerAuthed] = useState(null);

  useEffect(() => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
        const token = await user.getIdToken();
        setAuthToken(token);
        setIsAuthenticated(true);
      } else {
        setUserId(null);
        setAuthToken(null);
        setIsAuthenticated(false);
      }
    });
  }, []);

  // check for redirect process during auth
  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      console.log('There was an error authenticating', error);
    });
  }, []);

  // ping the server to check if it's up
  useEffect(() => {
    if (isAuthenticated) {
      fetch(`${process.env.REACT_APP_SERVER_URL}/ping`).catch((err) =>
        console.log(err)
      );
    }
  }, [isAuthenticated]);

  // connect to the websocket server and store socket connection
  useEffect(() => {
    if (!socketClient && authToken) {
      const newSocket = io(`${process.env.REACT_APP_SERVER_URL}`, {
        // send auth token to authenticate with server
        auth: {
          userId,
          token: authToken,
        },
      });
      setSocketClient(newSocket);
    }
    // close the socket connection when this component unmounts
    return () => socketClient && socketClient.disconnect();
  }, [authToken, userId, socketClient]);

  // store client id when connected
  useEffect(() => {
    if (socketClient) {
      socketClient.on(events.CONNECTED, (clientId) => {
        setIsServerAuthed(!!clientId);
      });
    }
  }, [socketClient]);

  // catch any errors when connecting to websocket server
  useEffect(() => {
    if (socketClient) {
      socketClient.on(events.CONNECTION_ERROR, (err) => {
        setIsServerAuthed(false);
        setNumberOfClients(0);
      });
    }
  }, [socketClient]);

  // listen for number of connected clients
  useEffect(() => {
    if (socketClient) {
      socketClient.on(
        events.NUMBER_OF_CONNECTED_CLIENTS,
        (numberOfConnectedClients) => {
          setNumberOfClients(numberOfConnectedClients);
        }
      );
    }
  }, [socketClient]);

  const handleAuth = () => {
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider).catch((error) => {
      console.log('There was an error authenticating', error);
    });
  };

  const handleUnAuth = () => {
    auth.signOut();
    socketClient.disconnect();
    setIsServerAuthed(false);
    setNumberOfClients(0);
  };

  const handleSocketConnect = () => {
    setSocketClient(null);
  };

  const handleSocketDisconnect = () => {
    socketClient.disconnect();
    setIsServerAuthed(false);
    setNumberOfClients(0);
  };

  return (
    <>
      <div>firebase authenticated? {isAuthenticated ? 'true' : 'false'}</div>
      <button
        onClick={handleAuth}
        disabled={isAuthenticated === null || isAuthenticated}
      >
        Login to Firebase
      </button>
      <button
        onClick={handleUnAuth}
        disabled={isAuthenticated === null || !isAuthenticated}
      >
        Logout of Firebase
      </button>
      <div>server authenticated? {isServerAuthed ? 'true' : 'false'}</div>
      <button
        onClick={handleSocketConnect}
        disabled={!isAuthenticated || isServerAuthed === null || isServerAuthed}
      >
        Connect to Socket.io server
      </button>
      <button
        onClick={handleSocketDisconnect}
        disabled={
          !isAuthenticated || isServerAuthed === null || !isServerAuthed
        }
      >
        Disconnect from Socket.io server
      </button>
      <div>{numberOfClients} currently connected</div>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
