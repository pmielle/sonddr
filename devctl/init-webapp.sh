#!/usr/bin/env bash
set -euo pipefail

docker build --quiet -t webapp webapp

docker run --quiet -d --rm --name webapp --network sonddr \
	--mount 'type=bind,source=./webapp,target=/srv/sonddr' \
	webapp
