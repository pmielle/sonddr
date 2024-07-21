#!/usr/bin/env bash
set -euo pipefail

source ./deployment/.env

docker exec auth bash -c "
	/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080/auth --realm master --user $KEYCLOAK_ADMIN --password $KEYCLOAK_ADMIN_PASSWORD
	/opt/keycloak/bin/kcadm.sh create users --target-realm sonddr -s username=test -s enabled=true
	/opt/keycloak/bin/kcadm.sh set-password --target-realm sonddr --username test --new-password test
	/opt/keycloak/bin/kcadm.sh create users --target-realm sonddr -s username=test2 -s enabled=true
	/opt/keycloak/bin/kcadm.sh set-password --target-realm sonddr --username test2 --new-password test2
	"
