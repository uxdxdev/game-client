# Setup

- create self signed certificate by installing [mkcert](https://github.com/FiloSottile/mkcert)

```
mkcert -install // create local Certificate Authority
mkcert localhost // create localhost.pem and localhost-key.pem files
```

- update `.env` file

```
REACT_APP_SERVER_URL=https://localhost:3001
```

- start dev server and point to the `*.pem` files created earlier

### MacOS

```
HTTPS=true SSL_CRT_FILE=localhost.pem SSL_KEY_FILE=localhost-key.pem npm start
```

### Windows

```
// !! do not put spaces before or after &&
set HTTPS=true&&set SSL_CRT_FILE=localhost.pem&&set SSL_KEY_FILE=localhost-key.pem&&npm start
```
