#!/bin/bash
set -e
CONTAINERS=$(docker container ls -a --filter "label=containerssh_connection_id" --format "{{ .ID }}")

if [ -n "$CONTAINERS" ]; then 
    echo $CONTAINERS | xargs docker rm -f
    echo "Removed all k3s lab containers"
else 
    echo "No containers found"
fi

if [[ "$1" == "--all" ]]; then
    echo "Removing k3d clusters"
    K3s_CONTAINERS=$(docker container ls -a --filter "label=k3d.cluster" --format "{{ .ID }}")

    if [ -n "$K3s_CONTAINERS" ]; then 
        echo $K3s_CONTAINERS | xargs docker rm -f
        echo "Removed all k3s cluster containers"
    else 
        echo "No k3d cluster containers found"
    fi
    echo "Removing volumes"
    VOLUMES=$(docker volume ls --filter "name=lab-k3s-" --filter "name=k3d-" --format "{{ .Name }}")
    if [ -n "$VOLUMES" ]; then 
        echo $VOLUMES | xargs docker volume rm -f
        echo "Removed all k3s lab volumes"
    else 
        echo "No volumes found"
    fi
fi

if [[ "$1" == "--help" ]]; then
    echo "Flags:\n
    --all removes k3d clusters and volumes
    --help shows help"
fi