# build containerssh agent from source to support ARM
FROM golang:1.21 as agent
WORKDIR /app
RUN git clone https://github.com/ContainerSSH/agent
WORKDIR /app/agent
RUN go mod tidy
RUN go generate
RUN CGO_ENABLED=0 GOOS=linux go build -v -o /usr/bin/containerssh-agent

FROM ubuntu:jammy as ubuntu-systemd
# copy in containerssh-agent
COPY --from=agent /usr/bin/containerssh-agent /usr/bin/containerssh-agent
##################### BASED ON https://github.com/nestybox/dockerfiles/blob/master/ubuntu-jammy-systemd/Dockerfile

#
# Install SystemD and other packages installation
#
RUN apt-get update &&                            \
    apt-get install -y --no-install-recommends   \
    curl jq git net-tools vim tmux bash-completion wget iputils-ping less \
    systemd systemd-sysv libsystemd0 ca-certificates dbus iptables iproute2 kmod locales sudo udev && \
    # Prevents journald from reading kernel messages from /dev/kmsg
    echo "ReadKMsg=no" >> /etc/systemd/journald.conf &&               \
    # Housekeeping
    apt-get clean -y &&                                               \
    rm -rf                                                            \
       /var/cache/debconf/* /var/lib/apt/lists/* /var/log/* /tmp/*    \
       /var/tmp/* /usr/share/doc/* /usr/share/man/* /usr/share/local/*
RUN adduser --uid 832 --shell /bin/bash --disabled-password lab \
    && echo "lab ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/lab \
    && echo "export PS1='${USERNAME}@${ENVIRONMENT}:\w\$ '" > /home/lab/.bashrc \
    && echo "[[ -f ~/.bashrc ]] && . ~/.bashrc" > /home/lab/.bash_profile

# Disable systemd services/units that are unnecessary within a container.
RUN systemctl mask systemd-udevd.service \
                   systemd-udevd-kernel.socket \
                   systemd-udevd-control.socket \
                   systemd-modules-load.service \
                   sys-kernel-debug.mount \
                   sys-kernel-tracing.mount

# Make use of stopsignal (instead of sigterm) to stop systemd containers.
STOPSIGNAL SIGRTMIN+3

# copy over bash config
COPY ./bash_profile /home/lab/.bash_profile
COPY ./bashrc /home/lab/.bashrc

# we need entrypoint to be empty because ContainerSSH is weird
ENTRYPOINT []

FROM ubuntu-systemd as ubuntu-systemd-docker

# Install Docker & compose
RUN curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh \
    # Add user "admin" to the Docker group
    && usermod -a -G docker lab
ADD https://raw.githubusercontent.com/docker/docker-ce/master/components/cli/contrib/completion/bash/docker /etc/bash_completion.d/docker.sh
RUN DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker} && \
    mkdir -p $DOCKER_CONFIG/cli-plugins && \
    curl -SL https://github.com/docker/compose/releases/download/v2.27.1/docker-compose-linux-x86_64 \
        -o $DOCKER_CONFIG/cli-plugins/docker-compose && \
    chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
COPY --from=docker --chown=root:root --chmod=644 ./config/daemon.json /etc/docker/daemon.json