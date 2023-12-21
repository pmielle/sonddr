#!/usr/bin/env bash
set -euo pipefail

docker network create sonddr

./init-dev-auth.sh &
./init-dev-database.sh &
./init-dev-api.sh &
./init-dev-webapp.sh &

wait
