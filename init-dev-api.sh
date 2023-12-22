#!/usr/bin/env bash
set -euo pipefail

docker build --quiet -t express api

docker run --quiet -d --rm --network sonddr --name express \
	--env KEYCLOAK_URL=$HOSTNAME \
	express
