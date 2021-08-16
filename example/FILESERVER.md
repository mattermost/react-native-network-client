# File Server

### How to run File Download Server
1. Run File Download Server
```
npm run file-download-server
```
2. Verify File Download Server is running: `http://127.0.0.1:8009`.

### How to run File Upload Server
1. Run File Upload Server
```
npm run file-upload-server
```
2. Verify File Upload Server is running: `http://127.0.0.1:8008`.

# Request Paths
Headers:
| Key | Description | Example |
| :--- | :--- | :--- |
| Authorization | Default null. If specified, cookie token is validated. (**protected request only**) | `Authorization: Bearer xyz` |

Query:
| Key | Description | Example |
| :--- | :--- | :--- |
| ignoreToken | Default null. If true, token validation is ignored. (**protected request only**) | `ignoreToken=true` |
| tokenSource | Default null. If `headers` / `query` / `cookies` , token validation is performed. (**protected request only**) | `tokenSource=headers` |
| token | Default null. If specified and `tokenSource=query` is present, query token validation is performed by token source method. If specified and `tokenSource=query` is not present, query token validation is performed by default method. (**protected request only**) | `token=xyz` |

Cookies:
| Key | Description | Example |
| :--- | :--- | :--- |
| token | Default null. If specified and `tokenSource=query` is present, cookie token validation is performed by token source method. If specified and `tokenSource=query` is not present, cookie token validation is performed by default method. (**protected request only**) | `token=xyz` |

### Get File Request
Path: `/api/files/:filename`

Example:
```
curl -X GET http://127.0.0.1:8008/api/files/fast-image.jpg
```

### Protected Get File Request
Path: `/protected/api/files/:filename`

Example:
```
curl -X GET -H "Authorization: Bearer xyz" http://127.0.0.1:8008/protected/api/files/fast-image.jpg
```

### Multipart Post File Request
Path: `/api/files/multipart`

Example:
```
curl -X POST http://127.0.0.1:8008/api/files/multipart
```

### Protected Multipart Post File Request
Path: `/protected/api/files/multipart`

Example:
```
curl -X POST -H "Authorization: Bearer xyz" http://127.0.0.1:8008/api/files/multipart
```

### Stream Post File Request
Path: `/api/files/stream/:filename`

Example:
```
curl -X POST http://127.0.0.1:8008/api/files/stream/sample-image.jpg
```

### Protected Stream Post File Request
Path: `/protected/api/files/stream/:filename`

Example:
```
curl -X POST -H "Authorization: Bearer xyz" http://127.0.0.1:8008/api/files/stream/sample-image.jpg
```

### Generate Token Request
Path: `/login/:id`

Example:
```
curl -X GET http://127.0.0.1:8008/login/123
```

Example response:
```
HTTP/1.1 200 OK
set-cookie: token=xyz
token: xyz

{
    "id" : "123",
    "token": "xyz"
}
```
