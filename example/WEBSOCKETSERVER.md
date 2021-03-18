# Web Socket Server

### How to run Web Socket Server
1. Run Web Socket Server
```
npm run web-socket-server
```
2. Verify Web Socket Server is running: `ws://localhost:3000`.

### Web Socket Request
Path: `/api/websocket`

Example:
```
npx wscat -c ws://localhost:3000/api/websocket
> {"message":"test response body"}
```
