#!/usr/bin/env bash
set -euo pipefail

if [[ -z ${SONDDR_AUTHORITY:-} ]]; then echo "SONDDR_AUTHORITY env var is missing" >&2; exit 1; fi

docker run --quiet -d --rm --name reverse-proxy \
	--network sonddr -p 80:80 -p 27017:27017 \
	--mount type=bind,source=./reverse-proxy/nginx.conf,target=/etc/nginx/nginx.conf \
	--env SONDDR_AUTHORITY=$SONDDR_AUTHORITY \
	nginx
