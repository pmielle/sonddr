#!/usr/bin/env bash
set -euo pipefail

docker build --quiet -t express api

docker run --quiet -d --rm --network sonddr -p 3000:3000 --name express \
	express
