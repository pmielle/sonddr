#!/usr/bin/env bash
set -euo pipefail

docker build --quiet -t angular webapp

docker run --quiet -d --rm --network sonddr --name angular \
  angular
