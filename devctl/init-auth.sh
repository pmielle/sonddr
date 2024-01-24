#!/usr/bin/env bash
set -euo pipefail

if [[ -z ${SONDDR_AUTHORITY:-} ]]; then echo "SONDDR_AUTHORITY env var is missing" >&2; exit 1; fi

# https://www.keycloak.org/getting-started/getting-started-docker

# v23 causes problem
# --http-relative-path must match the reverse proxy path
docker run --quiet -d --rm --name auth \
	--network sonddr \
	--mount="type=bind,source=./auth/sonddr-realm.json,target=/opt/keycloak/data/import/sonddr-realm.json" \
	--env KEYCLOAK_ADMIN=$KEYCLOAK_USERNAME --env KEYCLOAK_ADMIN_PASSWORD=$KEYCLOAK_PASSWORD \
	--env SONDDR_AUTHORITY --env SONDDR_BACKEND_SECRET --env SONDDR_GOOGLE_SECRET \
	quay.io/keycloak/keycloak:22.0.1 \
	start-dev  --import-realm --http-relative-path /auth
