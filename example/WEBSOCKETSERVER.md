# WebSocket Server

### How to run WebSocket Server
1. Run WebSocket Server
```
npm run websocket-server
```
2. Verify WebSocket Server is running: `ws://localhost:3000`.

### WebSocket Request
Path: `/api/websocket`

Example:
```
npx wscat -c ws://localhost:3000/api/websocket
> {"message":"test response body"}
```
