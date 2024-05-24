#!/usr/bin/env bash
set -euo pipefail

# https://www.mongodb.com/community/forums/t/docker-compose-replicasets-getaddrinfo-enotfound/14301

docker run --quiet -d --rm --name database \
	--network sonddr \
	--mount type=bind,source=./database/,target=/my_data/ \
	mongo:6 \
	--replSet sonddr

echo "sleeping 10s to let the container spawn..."
sleep 10

docker exec \
	database \
	mongosh --quiet \
		--eval 'rs.initiate()'

echo "sleeping 10s to let the replica set initiate..."
sleep 10

docker exec \
	database \
	mongosh --quiet \
		--eval 'use sonddr' \
		--eval 'db.createCollection("goals", { changeStreamPreAndPostImages: { enabled: true} })' \
		--eval 'db.createCollection("cheers", { changeStreamPreAndPostImages: { enabled: true} })' \
		--eval 'db.createCollection("comments", { changeStreamPreAndPostImages: { enabled: true} })' \
		--eval 'db.createCollection("ideas", { changeStreamPreAndPostImages: { enabled: true} })' \
		--eval 'db.createCollection("users", { changeStreamPreAndPostImages: { enabled: true} })' \
		--eval 'db.createCollection("votes", { changeStreamPreAndPostImages: { enabled: true} })' \
		--eval 'db.createCollection("messages", { changeStreamPreAndPostImages: { enabled: true} })' \
		--eval 'db.createCollection("discussions", { changeStreamPreAndPostImages: { enabled: true} })' \
		--eval 'db.createCollection("notifications", { changeStreamPreAndPostImages: { enabled: true} })'

docker exec \
	database \
	mongoimport --db sonddr --collection goals --jsonArray /my_data/goals.json
