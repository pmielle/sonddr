#!/usr/bin/env bash
set -euo pipefail

docker network create sonddr >/dev/null 2>&1 || true

subcommand="$1"
service="$2"

init() { devctl/init-"$1".sh; }

stop() { docker stop "$1" >/dev/null 2>&1 || true; }

reinit() { stop "$1"; sleep 5; init "$1"; }

"$subcommand" "$service"
