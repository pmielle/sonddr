# sonddr

## local development

### container management

- `export SONDDR_AUTHORITY=$HOSTNAME` (or something else depending on dns)
- use `devctl.sh` to `init`, `reinit` or `stop` a dev instance of `auth`, `database`, `api`, `webapp` or `reverse-proxy` (n.b. init `reverse-proxy` requires all other containers to be up)

### on mobile hotspot

TEMPORARILY:
- add `<your_current_ip> <sonddr_authority>` to `/etc/hosts`
- enable `chrome://flags/#allow-insecure-localhost`
