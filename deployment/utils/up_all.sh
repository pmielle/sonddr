#!/usr/bin/env bash
set -euo pipefail

docker compose -f ./deployment/compose.yaml -f ./deployment/compose-dev.yaml up -d --build
echo "sleeping 20s to let auth init..."
sleep 20
./deployment/utils/create-test-users.sh
