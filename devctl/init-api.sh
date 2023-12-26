#!/usr/bin/env bash
set -euo pipefail

docker build --quiet -t api api

docker run --quiet -d --rm --network sonddr --name api \
	--env KEYCLOAK_URL=$HOSTNAME \
	api
