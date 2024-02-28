## How to run lab
1. Install docker and docker compose
2. Pull down both this repository and [ssh-lab-factory](https://github.com/devinchristianson/ssh-lab-factory)
2. Update `./ssh-lab-factory/authconfig.yml` for your lab
    1. Update the `DOMAIN` value to whatever base domain is pointed at the host
    2. Update list of usernames under the `test` group w/ the GitHub usernames of the ppl participating in the lab
3. Bring up this docker compose stack
4. Bring up the `ssh-lab-factory` stack
## Development usage
### Pre-requisites
- docker
- docker compose plugin
- entry in `/etc/hosts` for `127.0.0.1 *.localhost`
### Run
1. Bring up supporting containers with `docker compose up -d`
2. Open shell in labcontainer with `docker-compose run -it --build labcontainer`
### Build
1. Bump image version number in docker compose
2. `docker compose build labcontainer`
3. `docker compose push labcontainer`