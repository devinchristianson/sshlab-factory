## Requirements
- [Docker](https://www.docker.com/get-started/)
- [k3d](https://k3d.io/v5.6.0/)
- kubectl
- helm
## Initial Steps
1. Bring up cluster with
    `k3d cluster create --config ./k3dconfig.yml`
2. Inspect the cluster with
   - `kubectl get nodes`
   - `kubectl get namespaces`
   - `kubectl get pods -n kube-system`