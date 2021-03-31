# generate server certificate
openssl req \
	-x509 \
	-newkey rsa:4096 \
	-keyout certs/server_key.pem \
	-out certs/server_cert.pem \
	-nodes \
	-days 365 \
	-subj "/CN=localhost/O=Secure\ Client\ Certificate"

# Generate cert for generic secure client
openssl req \
	-newkey rsa:4096 \
	-keyout certs/client_key.pem \
	-out certs/client_csr.pem \
	-nodes \
	-days 365 \
	-subj "/CN=Alice"

openssl x509 \
	-req \
	-in certs/client_csr.pem \
	-CA certs/server_cert.pem \
	-CAkey certs/server_key.pem \
	-out certs/client_cert.pem \
	-set_serial 01 \
	-days 365

openssl pkcs12 \
    -export -out certs/client_cert.p12 \
	-in certs/client_cert.pem \
	-inkey certs/client_key.pem \
	-passin pass:password -passout pass:password

# Generate cert for secure fast image server client
openssl req \
	-newkey rsa:4096 \
	-keyout certs/secure_fast_image_server_client_key.pem \
	-out certs/secure_fast_image_server_client_csr.pem \
	-nodes \
	-days 365 \
	-subj "/CN=Alice"

openssl x509 \
	-req \
	-in certs/secure_fast_image_server_client_csr.pem \
	-CA certs/server_cert.pem \
	-CAkey certs/server_key.pem \
	-out certs/secure_fast_image_server_client_cert.pem \
	-set_serial 02 \
	-days 365

openssl pkcs12 \
    -export -out certs/secure_fast_image_server_client_cert.p12 \
	-in certs/secure_fast_image_server_client_cert.pem \
	-inkey certs/secure_fast_image_server_client_key.pem \
	-passin pass:password -passout pass:password

# Generate cert for secure file upload server client
openssl req \
	-newkey rsa:4096 \
	-keyout certs/secure_file_upload_server_client_key.pem \
	-out certs/secure_file_upload_server_client_csr.pem \
	-nodes \
	-days 365 \
	-subj "/CN=Alice"

openssl x509 \
	-req \
	-in certs/secure_file_upload_server_client_csr.pem \
	-CA certs/server_cert.pem \
	-CAkey certs/server_key.pem \
	-out certs/secure_file_upload_server_client_cert.pem \
	-set_serial 03 \
	-days 365

openssl pkcs12 \
    -export -out certs/secure_file_upload_server_client_cert.p12 \
	-in certs/secure_file_upload_server_client_cert.pem \
	-inkey certs/secure_file_upload_server_client_key.pem \
	-passin pass:password -passout pass:password

# Generate cert for secure mockserver client
openssl req \
	-newkey rsa:4096 \
	-keyout certs/secure_mockserver_client_key.pem \
	-out certs/secure_mockserver_client_csr.pem \
	-nodes \
	-days 365 \
	-subj "/CN=Alice"

openssl x509 \
	-req \
	-in certs/secure_mockserver_client_csr.pem \
	-CA certs/server_cert.pem \
	-CAkey certs/server_key.pem \
	-out certs/secure_mockserver_client_cert.pem \
	-set_serial 04 \
	-days 365

openssl pkcs12 \
    -export -out certs/secure_mockserver_client_cert.p12 \
	-in certs/secure_mockserver_client_cert.pem \
	-inkey certs/secure_mockserver_client_key.pem \
	-passin pass:password -passout pass:password

# Generate cert for secure websocket server client
openssl req \
	-newkey rsa:4096 \
	-keyout certs/secure_websocket_server_client_key.pem \
	-out certs/secure_websocket_server_client_csr.pem \
	-nodes \
	-days 365 \
	-subj "/CN=Alice"

openssl x509 \
	-req \
	-in certs/secure_websocket_server_client_csr.pem \
	-CA certs/server_cert.pem \
	-CAkey certs/server_key.pem \
	-out certs/secure_websocket_server_client_cert.pem \
	-set_serial 05 \
	-days 365

openssl pkcs12 \
    -export -out certs/secure_websocket_server_client_cert.p12 \
	-in certs/secure_websocket_server_client_cert.pem \
	-inkey certs/secure_websocket_server_client_key.pem \
	-passin pass:password -passout pass:password
