#!/usr/bin/env bash
set -euo pipefail

docker build --quiet -t webapp webapp

docker run --quiet -d --rm --network sonddr --name webapp \
  webapp
