# Setup

- create self signed certificate

### MacOS

```
openssl req -newkey rsa:2048 -new -nodes -keyout key.pem -out csr.pem
openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out server.crt
```

### Windows

```
// todo
```

- update `.env` file

```
REACT_APP_SERVER_URL=https://localhost:3001
```

- start dev server

### MacOS

```
HTTPS=true SSL_CRT_FILE=server.crt SSL_KEY_FILE=key.pem npm start
```

### Windows

```
// !! do not put spaces before or after &&
set HTTPS=true&&set SSL_CRT_FILE=server.crt&&set SSL_KEY_FILE=key.pem&&npm start
```
