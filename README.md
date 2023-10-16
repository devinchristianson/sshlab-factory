# SSH Lab Factory

## Goals
The main goal of this project is to build a simple auth/config webhook microservice to interface with [ContainerSSH](https://containerssh.io/), then use this system to create a framework for running/building CLI-based labs on either Docker or Kubernetes (TBD).

## SSH Authentication Method
SSH Authentication is handled by requiring the user to login to SSH with their Github user + requested environment (in format `username/environment`) and an SSH key in their Github. 

If the user is on the allowlist for the requested environment and the provided key matches one of their keys in GitHub, authentication succeeds.

## Configuration Scheme


## Implementation
The auth/config webhook service is built using [Open Policy Agent](https://www.openpolicyagent.org/) - see Rego in `authconfig/opa`, as this provides a fairly concise way to specify the desired webhook behavior.

The docker-compose file in the root is purely for testing at the moment