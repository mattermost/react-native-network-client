# WebSocket Server

### How to run WebSocket Server
1. Run WebSocket Server
```
npm run websocket-server
```
2. Verify WebSocket Server is running: `ws://127.0.0.1:3000`.

### WebSocket Request
Path: `/api/websocket`

Example:
```
npx wscat -c ws://127.0.0.1:3000/api/websocket
> {"message":"test response body"}
```
