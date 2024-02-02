#!/usr/bin/env bash
set -euo pipefail

# https://www.mongodb.com/community/forums/t/docker-compose-replicasets-getaddrinfo-enotfound/14301

docker run --quiet -d --rm --name database \
	--network sonddr \
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
		--eval 'db.createCollection("notifications", { changeStreamPreAndPostImages: { enabled: true} })' \
		--eval 'db.goals.insertOne({name: "No poverty", icon: "home", color: "#89465E", order: 1})' \
		--eval 'db.goals.insertOne({name: "Health and well-being", icon: "health_and_safety", color: "#894646", order: 2})' \
		--eval 'db.goals.insertOne({name: "Reduced inequalities", icon: "handshake", color: "#896246", order: 3})' \
		--eval 'db.goals.insertOne({name: "Sustainability", icon: "recycling", color: "#898246", order: 4})' \
		--eval 'db.goals.insertOne({name: "Preserved ecosystems", icon: "eco", color: "#4B8946", order: 5})' \
		--eval 'db.goals.insertOne({name: "Peace and justice", icon: "balance", color: "#468981", order: 6})' \
		--eval 'db.goals.insertOne({name: "Decent work", icon: "work", color: "#464D89", order: 7})' \
		--eval 'db.goals.insertOne({name: "Quality education", icon: "school", color: "#684689", order: 8})'
