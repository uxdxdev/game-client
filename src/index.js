import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';

const events = {
  CONNECTED: 'connected',
  NUMBER_OF_CONNECTED_CLIENTS: 'number_of_connected_clients',
  CONNECTION_ERROR: 'connect_error',
};

const App = () => {
  const [socketClient, setSocketClient] = useState(null);
  const [clientId, setClientId] = useState('');
  const [numberOfClients, setNumberOfClients] = useState(0);

  // ping the server to check if it's up
  useEffect(() => {
    fetch(`${process.env.REACT_APP_SERVER_URL}/ping`).catch((err) =>
      console.log(err)
    );
  }, []);

  // connect to the server and store socket connection
  useEffect(() => {
    const newSocket = io(`${process.env.REACT_APP_SERVER_URL}`, {
      // send auth token to authenticate with server
      auth: {
        token: 'test',
      },
    });
    setSocketClient(newSocket);

    // close the socket connection when this component unmounts
    return () => newSocket.close();
  }, [setSocketClient]);

  // catch any errors when connecting to server
  useEffect(() => {
    if (socketClient) {
      socketClient.on(events.CONNECTION_ERROR, (err) => {
        console.log(err.message);
      });
    }
  }, [socketClient]);

  // store client id when connected
  useEffect(() => {
    if (socketClient) {
      socketClient.on(events.CONNECTED, (id) => {
        setClientId(id);
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

  return (
    <>
      <div>{numberOfClients} currently connected</div>
      <div>Client id {clientId}</div>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
