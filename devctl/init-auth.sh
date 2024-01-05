#!/usr/bin/env bash
set -euo pipefail

if [[ -z ${SONDDR_AUTHORITY:-} ]]; then echo "SONDDR_AUTHORITY env var is missing" >&2; exit 1; fi

# https://www.keycloak.org/getting-started/getting-started-docker

# v23 causes problem
# --http-relative-path must match the reverse proxy path
docker run --quiet -d --rm --name auth \
	--network sonddr \
	--env KEYCLOAK_ADMIN=admin --env KEYCLOAK_ADMIN_PASSWORD=admin \
	quay.io/keycloak/keycloak:22.0.1 \
	start-dev  --http-relative-path /auth

echo "sleeping 120s to let keycloak init..." # 60s is sometimes too short
sleep 120

kcadm="/opt/keycloak/bin/kcadm.sh"
kcadm_auth="--server http://localhost:8080/auth --realm master --user admin --password admin"

docker exec auth bash -c "$kcadm create realms $kcadm_auth -s realm=sonddr -s enabled=true"

docker exec auth bash -c "$kcadm create users $kcadm_auth -r sonddr -s username=test -s enabled=true"
docker exec auth bash -c "$kcadm set-password $kcadm_auth -r sonddr --username test --new-password test"

docker exec auth bash -c "$kcadm create clients $kcadm_auth -r sonddr -s clientId=sonddr-backend -s standardFlowEnabled=false -s enabled=true"
docker exec auth bash -c "$kcadm create clients $kcadm_auth -r sonddr -s clientId=sonddr-frontend -s 'redirectUris=[\"http://$SONDDR_AUTHORITY/*\"]' -s 'webOrigins=[\"http://$SONDDR_AUTHORITY\"]' -s directAccessGrantsEnabled=true -s publicClient=true -s enabled=true"
