#!/usr/bin/env bash
set -euo pipefail

docker compose -f ./deployment/compose.yaml -f ./deployment/compose-dev.yaml up -d --build
