FROM quay.io/keycloak/keycloak:22.0.1
# realm json references environment variables:
# - SONDDR_AUTHORITY
# - SONDDR_GOOGLE_SECRET
# - SONDDR_BACKEND_SECRET
COPY sonddr-realm.json /opt/keycloak/data/import/
COPY my-theme/ /opt/keycloak/themes/my-theme/
# start-dev needs environment variables:
# - KEYCLOAK_ADMIN
# - KEYCLOAK_ADMIN_PASSWORD
CMD ["start-dev", "--import-realm", "--http-relative-path", "/auth", "--proxy", "edge"]
