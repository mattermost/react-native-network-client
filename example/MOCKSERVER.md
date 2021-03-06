# Mock Server

### How to run Mockserver
1. Run Mockserver
```
npm run mockserver
```
2. Verify Mockserver is running: `http://127.0.0.1:8080`.

# Request Methods
Base URL: `http://127.0.0.1:8080`
Options:
| Option | Description | Example |
| :--- | :--- | :--- |
| subpath | resource path relative to base path | `/basepath/subpath` |
| params | query parameters | `/path?sort=asc` |
| headers | request headers | `curl -i -H "Accept: application/json" -H "Content-Type: application/json" http://host/path` |
| body | request body | `curl -i -d "key1=value1&key2=value2" http://host/path` |
| response status | request header for assigning response status | `curl -i -H "response-status: 404 Not Found" http://host/path` |

Example response:
```
HTTP/1.1 200 OK
content-type: application/json; charset=utf-8
server: mockserver

{
    "message": "Non-secure request!"
    "request" : {
        "url" : "http://127.0.0.1:8080/get"
        "method" : "GET",
        "headers" : {
            "key1" : "value1"
        },
        "body" : {
            "key1" : "value1"
        }
    }
}
```

### Get Request
Base Path: `/get`

Example:
```
curl -X GET -H "Content-Type: application/json" http://127.0.0.1:8080/get
```

### Post Request
Base Path: `/post`

Example:
```
curl -X POST -d "{\"name\":\"John Doe\",\"phone\":\"333-333-3333\"}" -H "Content-Type: application/json" http://127.0.0.1:8080/post
```

### Put Request
Base Path: `/put`

Example:
```
curl -X PUT -d "{\"name\":\"John Doe\",\"phone\":\"444-444-4444\"}" -H "Content-Type: application/json" http://127.0.0.1:8080/put
```

### Patch Request
Base Path: `/patch`

Example:
```
curl -X PATCH -d "{\"phone\":\"555-555-5555\"}" -H "Content-Type: application/json" http://127.0.0.1:8080/patch
```

### Delete Request
Base Path: `/delete`

Example:
```
curl -X DELETE -d "{\"permanent\":true}" -H "Content-Type: application/json" http://127.0.0.1:8080/delete
```
