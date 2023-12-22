#!/usr/bin/env bash
set -euo pipefail

docker run --quiet -d --rm --name nginx \
	--network sonddr -p 80:80 \
	--mount type=bind,source=./reverse-proxy/nginx.conf,target=/etc/nginx/conf.d/default.conf \
	nginx
