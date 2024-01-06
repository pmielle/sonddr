#!/usr/bin/env bash
set -euo pipefail

if [[ -z ${SONDDR_AUTHORITY:-} ]]; then echo "SONDDR_AUTHORITY env var is missing" >&2; exit 1; fi

docker build --quiet -t api api

docker run --quiet -d --rm --network sonddr --name api \
	--mount 'type=volume,src=api-uploads,dst=/srv/sonddr/uploads' \
	--env KEYCLOAK_URL="http://$SONDDR_AUTHORITY/auth" \
	api
