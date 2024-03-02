FROM ubuntu:22.04

RUN apt update && apt install -y sudo

RUN adduser --uid 832 --shell /bin/bash --disabled-password lab \
    && echo "lab ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/lab \
    && echo "export PS1='${USERNAME}@${ENVIRONMENT}:\w\$ '" > /home/lab/.bashrc \
    && echo "[[ -f ~/.bashrc ]] && . ~/.bashrc" > /home/lab/.bash_profile

USER lab

WORKDIR /home/lab