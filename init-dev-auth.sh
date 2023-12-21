#!/usr/bin/env bash
set -euo pipefail

# https://www.keycloak.org/getting-started/getting-started-docker

docker run -d --rm --network sonddr -p 8080:8080 --name keycloak -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:22.0.1 start-dev # v23 causes problems

echo "sleeping 60s to let keycloak init..." # 10s is too short
sleep 60

kcadm="/opt/keycloak/bin/kcadm.sh"
kcadm_auth="--server http://localhost:8080 --realm master --user admin --password admin"

docker exec keycloak bash -c "$kcadm create realms $kcadm_auth -s realm=sonddr -s enabled=true"

docker exec keycloak bash -c "$kcadm create users $kcadm_auth -r sonddr -s username=test -s enabled=true"
docker exec keycloak bash -c "$kcadm set-password $kcadm_auth -r sonddr --username test --new-password test"

docker exec keycloak bash -c "$kcadm create clients $kcadm_auth -r sonddr -s clientId=sonddr-backend -s standardFlowEnabled=false -s enabled=true"
docker exec keycloak bash -c "$kcadm create clients $kcadm_auth -r sonddr -s clientId=sonddr-frontend -s 'redirectUris=[\"http://192.168.1.14:4200/*\", \"http://0.0.0.0:4200/*\"]' -s 'webOrigins=[\"http://192.168.1.14:4200\", \"http://0.0.0.0:4200\"]' -s directAccessGrantsEnabled=true -s publicClient=true -s enabled=true"
