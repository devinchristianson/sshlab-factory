# SSH Lab Factory

## Goals
The main goal of this project is to build a simple auth/config webhook microservice to interface with [ContainerSSH](https://containerssh.io/), then use this system to create a framework for running/building CLI-based labs on either Docker or Kubernetes (TBD).

## SSH Authentication Method
SSH Authentication is handled by requiring the user to login to SSH with their Github user + requested environment (in format `username/environment`) and an SSH key in their Github. 

If the user is on the allowlist for the requested environment and the provided key matches one of their keys in GitHub, authentication succeeds.

## Configuration Scheme


## Implementation


## Quickstart

### Pre-reqs:
#### Host requirements:
- Docker
- Docker compose plugin
- (optional) sysbox

#### Supporting infra:
- (optional) publically exposed port 80
- (optional) public domain/subdomain pointed at host
- lab participants need access to ports 2222,80,443

### Setup
- Copy env.example to `.env` and update the values
- Updated `authconfig.yml` groups to include the expected lab members Github usernames
- Build lab clients with `docker compose --profile lab-client build`
- Build other required containers `docker compose build`
- Bring up the stack with `docker compose up`


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