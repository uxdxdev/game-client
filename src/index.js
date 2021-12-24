import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';
import { customEvents, socketIoEvents } from './constants';

const App = () => {
  const [socketClient, setSocketClient] = useState(null);
  const [clientId, setClientId] = useState('');
  const [numberOfClients, setNumberOfClients] = useState(0);

  // ping the server to check if it's up
  useEffect(() => {
    fetch('/ping')
      .then((res) => res.json())
      .then((data) => console.log(data));
  }, []);

  useEffect(() => {
    // defaults to `http://${window.location.hostname}:3000`
    const newSocket = io();
    setSocketClient(newSocket);
    // close the socket connection when this component unmounts
    return () => newSocket.close();
  }, [setSocketClient]);

  useEffect(() => {
    if (socketClient) {
      // store client.id when connected
      socketClient.on(socketIoEvents.CONNECTED, (id) => {
        setClientId(id);
      });

      socketClient.on(
        customEvents.NUMBER_OF_CONNECTED_CLIENTS,
        (numberOfConnectedClients) => {
          setNumberOfClients(numberOfConnectedClients);
        }
      );
    }
  }, [socketClient]);

  return (
    <>
      <div>{numberOfClients} currently connected</div>
      <div>Client id {clientId}</div>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
