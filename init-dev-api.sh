#!/usr/bin/env bash
set -euo pipefail

docker build -t express api

docker run -d --rm --network sonddr -p 3000:3000 --name express \
	express
