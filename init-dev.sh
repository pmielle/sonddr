#!/usr/bin/env bash
set -euo pipefail

# create the docker network if it does not already exist
# n.b. custom network is needed for container to be able to communicate by name
[[ $(docker network ls | grep sonddr) ]] || docker network create sonddr

# kill previous containers
docker container ls | ( grep -E 'mongo|keycloak|express|angular' || true ) | awk '{print $1}' | xargs docker kill

# spawn everything in parallel
./init-dev-auth.sh &
./init-dev-database.sh &
./init-dev-api.sh &
./init-dev-webapp.sh &

# wait for everyone to finish
wait
