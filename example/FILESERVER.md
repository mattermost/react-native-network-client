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
curl -X GET http://localhost:8008/api/files/fast-image.jpg
```

### Protected Get File Request
Path: `/protected/api/files/:filename`

Example:
```
curl -X GET -H "Authorization: Bearer xyz" http://localhost:8008/protected/api/files/fast-image.jpg
```

### Post File Request
Path: `/api/files/:filename`

Example:
```
curl -X POST http://localhost:8008/api/files/sample-image.jpg
```

### Protected Post File Request
Path: `/protected/api/files/:filename`

Example:
```
curl -X POST -H "Authorization: Bearer xyz" http://localhost:8008/api/files/sample-image.jpg
```

### Generate Token Request
Path: `/login/:id`

Example:
```
curl -X GET http://localhost:8008/login/123
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
