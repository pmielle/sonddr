FROM quay.io/keycloak/keycloak:22.0.1 as base
# realm json references environment variables:
# - SONDDR_AUTHORITY
# - SONDDR_GOOGLE_SECRET
# - SONDDR_BACKEND_SECRET
COPY sonddr-realm.json /opt/keycloak/data/import/
COPY my-theme/ /opt/keycloak/themes/my-theme/

FROM base as dev
# start-dev needs environment variables:
# - KEYCLOAK_ADMIN
# - KEYCLOAK_ADMIN_PASSWORD
CMD ["start-dev", "--import-realm", "--http-relative-path", "/auth", "--proxy", "edge", "--db", "postgres", "--db-url-host", "auth-database", "--db-username", "$POSTGRES_USER", "--db-password", "$POSTGRES_PASSWORD"]

FROM base as prod
# start needs environment variables:
# - KEYCLOAK_ADMIN
# - KEYCLOAK_ADMIN_PASSWORD
CMD ["start", "--import-realm", "--http-relative-path", "/auth", "--proxy", "edge", "--hostname", "$SONDDR_AUTHORITY", "--db", "postgres", "--db-url-host", "auth-database", "--db-username", "$POSTGRES_USER", "--db-password", "$POSTGRES_PASSWORD"]
