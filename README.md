# sonddr

## local development

1) setup a dev ssl certificate with a letsencrypt file tree:
```
letsencrypt/live/<your_hostname>/privkey.pem
letsencrypt/live/<your_hostname>/fullchain.pem
```

2) create `deployment/.env` with the following variables:
```bash
SONDDR_AUTHORITY='<your_hostname>'
KEYCLOAK_URL='https://<your_hostname>/auth'
SONDDR_BACKEND_SECRET='toto'
SONDDR_GOOGLE_SECRET='toto'
KEYCLOAK_ADMIN='admin'
KEYCLOAK_ADMIN_PASSWORD='admin'
NODE_TLS_REJECT_UNAUTHORIZED='0'
```

3) use `-f deployment/compose-dev.yaml` to:
- build the containers instead of using the ones from ghcr.io
- trigger `ng serve` and mount the webapp source code to be able to iterate more easily
