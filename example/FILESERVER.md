# File Server

### How to run Fast Image Server
1. Run Fast Image Server
```
npm run fast-image-server
```
2. Verify Fast Image Server is running: `http://localhost:8009`.

### How to run File Upload Server
1. Run File Upload Server
```
npm run file-upload-server
```
2. Verify File Upload Server is running: `http://localhost:8008`.

# Request Paths

### Get File Request
Path: `/api/files/:filename`

Example:
```
curl -X GET http://localhost:8080/api/files/fast-image.jpg
```

### Post File Request
Path: `/api/files/:filename`

Example:
```
curl -X POST http://localhost:8080/api/files/sample-image.jpg
```
