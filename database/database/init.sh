#!/usr/bin/env bash
set -euo pipefail

mongosh --eval 'rs.initiate({_id: "sonddr", members: [{_id: 0, host: "database:27017"}]})'
mongosh -f /my_data/init.js
mongoimport --db sonddr --collection goals --jsonArray /my_data/goals.json
