# sonddr

## local development

### container management

use `devctl.sh` to `init`, `reinit` or `stop` a dev instance of `auth`, `database`, `api`, `webapp` or `reverse-proxy` (n.b. init `reverse-proxy` requires all other containers to be up)

### on mobile hotspot

TEMPORARILY:
- add `<your_current_ip> <your_hostname>` to `/etc/hosts`
- enable `chrome://flags/#allow-insecure-localhost`
