# sonddr

## local development

- setup a dev ssl certificate with a letsencrypt file tree:
```
deployment/letsencrypt/live/<your_hostname>/privkey.pem
deployment/letsencrypt/live/<your_hostname>/fullchain.pem
```

- create `deployment/.env` with the following variables:
```bash
SONDDR_AUTHORITY='<your_hostname>'
KEYCLOAK_URL='https://<your_hostname>/auth'
SONDDR_BACKEND_SECRET='toto'
SONDDR_GOOGLE_SECRET='toto'
KEYCLOAK_ADMIN='admin'
KEYCLOAK_ADMIN_PASSWORD='admin'
NODE_TLS_REJECT_UNAUTHORIZED='0'
POSTGRES_USER='postgres'
POSTGRES_PASSWORD='postgres'
POSTGRES_DB='keycloak'
GF_SECURITY_ADMIN_USER='grafana'
GF_SECURITY_ADMIN_PASSWORD='grafana'
VAPID_PUBLIC_KEY='<public_key>'
VAPID_PRIVATE_KEY='<private_key>'
```

- add `<your_ip> <your_hostname>` to `/etc/hosts` if you are on a hotspot

- use `-f deployment/compose-dev.yaml` to build the containers instead of using the ones from ghcr.io and trigger `ng serve` and mount the webapp source code to iterate more easily

