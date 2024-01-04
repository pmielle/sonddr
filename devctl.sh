#!/usr/bin/env bash
set -euo pipefail

# functions
# -----------------------------------------------
init() { devctl/init-"$1".sh; }

stop() { docker stop "$1" >/dev/null 2>&1 || true; }

reinit() { stop "$1"; sleep 5; init "$1"; }


# main 
# -----------------------------------------------
docker network create sonddr >/dev/null 2>&1 || true

# special subcommand "up" + authority
# n.b. early exit
if [[ "$1" = "up" ]]; then
	export SONDDR_AUTHORITY="${2:-$SONDDR_AUTHORITY}"
	reinit auth     &
	reinit database &
	reinit api      &
	reinit webapp   &
	wait 
	reinit reverse-proxy
	exit 0
fi

# otherwise service-level subcommand
subcommand="$1"
service="$2"

"$subcommand" "$service"
