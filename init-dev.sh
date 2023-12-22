#!/usr/bin/env bash
set -euo pipefail

# create the docker network if it does not already exist
# n.b. custom network is needed for container to be able to communicate by name
[[ $(docker network ls | grep sonddr) ]] || docker network create sonddr

# kill previous containers
running_containers=$(docker container ls | ( grep -E 'mongo|keycloak|express|angular|nginx' || true ) | awk '{print $1}')
if [[ ! -z ${running_containers:-} ]]; then
	for id in $running_containers; do docker kill $id; done
	echo "sleeping 5s to let the previous containers shut down..."
	sleep 5
fi

# spawn everything in parallel
./init-dev-auth.sh &
./init-dev-database.sh &
./init-dev-api.sh &
./init-dev-webapp.sh &

# wait for everyone to finish
wait

# needs other containers to be up
./init-dev-reverse-proxy.sh
