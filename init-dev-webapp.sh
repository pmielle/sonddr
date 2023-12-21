#!/usr/bin/env bash
set -euo pipefail

docker build --quiet -t angular webapp

docker run --quiet -d --rm --network sonddr -p 4200:4200 --name angular \
  angular
