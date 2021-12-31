import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
} from 'firebase/auth';
import './styles.css';

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
  DRAW: 'draw',
  INIT_CANVAS: 'init_canvas',
};

const App = () => {
  const [socketClient, setSocketClient] = useState(null);
  const [numberOfClients, setNumberOfClients] = useState(0);
  const [authToken, setAuthToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isServerAuthed, setIsServerAuthed] = useState(null);
  const [color, setColor] = useState('#000000');

  const x = useRef();
  const y = useRef();
  const isDrawing = useRef();
  const drawingCanvas = useRef();
  const canvasContext = useRef();
  const canvasContainer = useRef();

  useEffect(() => {
    setColor('#' + (Math.random().toString(16) + '00000').slice(2, 8));
  }, []);

  const drawLine = ({ x1, y1, x2, y2, strokeColor }) => {
    canvasContext.current.beginPath();
    canvasContext.current.strokeStyle = strokeColor;
    canvasContext.current.lineWidth = 5;
    canvasContext.current.moveTo(x1, y1);
    canvasContext.current.lineTo(x2, y2);
    canvasContext.current.stroke();
    canvasContext.current.closePath();
  };

  useEffect(() => {
    const canvas = drawingCanvas.current;
    const context = canvas.getContext('2d');
    canvasContext.current = context;
    let pointerIdArray = [];

    const handleMouseDown = (e) => {
      x.current = e.offsetX;
      y.current = e.offsetY;
      isDrawing.current = true;
      pointerIdArray.push(e.pointerId);
    };
    canvas.addEventListener('pointerdown', handleMouseDown);

    const handleMouseMove = (e) => {
      if (isDrawing.current === true && e.pointerId === pointerIdArray[0]) {
        const data = {
          x1: x.current,
          y1: y.current,
          x2: e.offsetX,
          y2: e.offsetY,
          strokeColor: color,
        };
        drawLine(data);
        x.current = e.offsetX;
        y.current = e.offsetY;

        if (socketClient) {
          socketClient.emit(events.DRAW, data);
        }
      }
    };
    canvas.addEventListener('pointermove', handleMouseMove);

    const handleMouseUp = (e) => {
      if (isDrawing.current === true) {
        x.current = 0;
        y.current = 0;
        isDrawing.current = false;
        pointerIdArray.filter((pointerId) => pointerId !== e.pointerId);
      }
    };
    window.addEventListener('pointerup', handleMouseUp);

    const handleWindowResize = () => {
      canvas.width = canvasContainer.current?.clientWidth;
      canvas.height = canvasContainer.current?.clientHeight;
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      canvas.removeEventListener('pointerdown', handleMouseDown);
      canvas.removeEventListener('pointermove', handleMouseMove);
      window.removeEventListener('pointerup', handleMouseUp);
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [color, socketClient]);

  useEffect(() => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
        const token = await user.getIdToken();
        setAuthToken(token);
      } else {
        setUserId(null);
        setAuthToken(null);
      }
    });
  }, []);

  // check for redirect process during auth
  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      console.log('There was an error authenticating', error);
    });
  }, []);

  // once authenticated, ping the server to check if it's up
  useEffect(() => {
    if (authToken) {
      fetch(`${process.env.REACT_APP_SERVER_URL}/ping`).catch((err) =>
        console.log(err)
      );
    }
  }, [authToken]);

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

  useEffect(() => {
    if (socketClient) {
      socketClient.on(events.DRAW, (data) => {
        drawLine(data);
      });
    }
  }, [socketClient]);

  useEffect(() => {
    if (socketClient) {
      socketClient.on(events.INIT_CANVAS, (data) => {
        data.forEach((item) => drawLine(item));
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
    <div className="h-full">
      <header>
        <div>firebase authenticated? {authToken ? 'true' : 'false'}</div>
        <button onClick={handleAuth} disabled={authToken}>
          Login to Firebase
        </button>
        <button
          onClick={handleUnAuth}
          disabled={authToken === null || !authToken}
        >
          Logout of Firebase
        </button>
        <div>server authenticated? {isServerAuthed ? 'true' : 'false'}</div>
        <button
          onClick={handleSocketConnect}
          disabled={!authToken || isServerAuthed === null || isServerAuthed}
        >
          Connect to Socket.io server
        </button>
        <button
          onClick={handleSocketDisconnect}
          disabled={!authToken || isServerAuthed === null || !isServerAuthed}
        >
          Disconnect from Socket.io server
        </button>
        <div>{numberOfClients} currently connected</div>
      </header>
      <div id="canvas-container" ref={canvasContainer}>
        <canvas
          ref={drawingCanvas}
          width={canvasContainer.current?.clientWidth}
          height={canvasContainer.current?.clientHeight}
        ></canvas>
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
