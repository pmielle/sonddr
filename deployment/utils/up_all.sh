#!/usr/bin/env bash
set -euo pipefail

docker compose -f ./deployment/compose.yaml -f ./deployment/compose-dev.yaml up -d
echo "sleeping 10s to let auth init..."
sleep 10
./deployment/utils/create-test-users.sh
