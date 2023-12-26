#!/usr/bin/env bash
set -euo pipefail

docker run --quiet -d --rm --name reverse-proxy \
	--network sonddr -p 80:80 \
	--mount type=bind,source=./reverse-proxy/nginx.conf,target=/etc/nginx/nginx.conf \
	--env SONDDR_URL=$HOSTNAME \
	nginx
