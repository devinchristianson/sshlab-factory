## Labs
- docker lab
- linux security lab (based on https://github.com/UMCST/linux-lab-docker)
- falco lab with shared log DB?
- ubuntu lab (for testing)

## Infra improvements
- auth-initialization w/ better security
    - generating ssh host keys
    - generating certs for mutual tls between containerSSH and authconfig
- advanced streaming?
    - use benthos to ingest log files into redis streams or similar, allowing for synchronized replaying & streaming
- metrics collection:
    - use https://github.com/prometheus/prometheus/blob/release-2.33/documentation/examples/prometheus-docker.yml to configure and collect 