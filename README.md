# sonddr

## local development

1) create `deployment/.env` with the following variables:
```bash
SONDDR_AUTHORITY='<your_hostname>'
KEYCLOAK_URL='http://<your_hostname>/auth'
SONDDR_BACKEND_SECRET='toto'
SONDDR_GOOGLE_SECRET='toto'
KEYCLOAK_ADMIN='admin'
KEYCLOAK_ADMIN_PASSWORD='admin'
```

2) use `docker compose -f deployment/compose.yaml -f deployment/compose-dev.yaml [...]` to:
- build the containers instead of using the ones from ghcr.io
- trigger `ng serve` and mount the webapp source code to be able to iterate more easily
