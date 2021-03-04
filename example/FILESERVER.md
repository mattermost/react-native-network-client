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

Query Params:
| Key | Description | Example |
| :--- | :--- | :--- |
| token | Default null. If specified, query string token is validated only when request header token does not exist. (**protected request only**) | `token=xyz` |
| ignoreToken | Default false. If true, token validation is ignored. (**protected request only**) | `ignoreToken=true` |
| ignoreHeaderToken | Default false. If true, header token validation is ignored. (**protected request only**) | `ignoreHeaderToken=true` |
| ignoreQueryToken | Default false. If true, query token validation is ignored. (**protected request only**) | `ignoreQueryToken=true` |
| ignoreCookieToken | Default false. If true, cookie token validation is ignored. (**protected request only**) | `ignoreCookieToken=true` |

Cookies:
| Key | Description | Example |
| :--- | :--- | :--- |
| token | Default null. If specified, cookie token is validated only when request header and query param tokens do not exist. (**protected request only**) | `token=xyz` |

### Get File Request
Path: `/api/files/:filename`

Example:
```
curl -X GET http://localhost:8080/api/files/fast-image.jpg
```

### Protected Get File Request
Path: `/protected/api/files/:filename`

Example:
```
curl -X GET -H "Authorization: Bearer xyz" http://localhost:8080/protected/api/files/fast-image.jpg
```

### Post File Request
Path: `/api/files/:filename`

Example:
```
curl -X POST http://localhost:8080/api/files/sample-image.jpg
```

### Protected Post File Request
Path: `/protected/api/files/:filename`

Example:
```
curl -X POST -H "Authorization: Bearer xyz" http://localhost:8080/api/files/sample-image.jpg
```

### Generate Token Request
Path: `/login/:id`

Example:
```
curl -X GET http://localhost:8080/login/123
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
