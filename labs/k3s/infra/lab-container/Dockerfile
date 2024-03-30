FROM containerssh/agent AS agent

FROM ubuntu:22.04

# copy in containerssh-agent
COPY --from=agent /usr/bin/containerssh-agent /usr/bin/containerssh-agent

# add pre-reqs for required installs
RUN DEBIAN_FRONTEND=noninteractive apt update \
    && apt install -y curl bash jq git net-tools vim tmux bash-completion wget sudo \
    && apt clean

# download and install kubectl
RUN set -e && cd "$(mktemp -d)" && VERSION="$(curl -L -s https://dl.k8s.io/release/stable.txt)" \
    && ARCH=$(dpkg --print-architecture) \
    && curl -LO "https://dl.k8s.io/release/$VERSION/bin/linux/$ARCH/kubectl" \
    && curl -LO "https://dl.k8s.io/$VERSION/bin/linux/$ARCH/kubectl.sha256" \
    && echo "$(cat kubectl.sha256)  kubectl" | sha256sum -c \
    && install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# download and install helm
RUN set -e && cd "$(mktemp -d)" && VERSION="$(curl -L -s https://get.helm.sh/helm-latest-version)" \
    && ARCH=$(dpkg --print-architecture) \
    && curl -LO "https://get.helm.sh/helm-$VERSION-linux-$ARCH.tar.gz" \ 
    && curl -LO "https://get.helm.sh/helm-$VERSION-linux-$ARCH.tar.gz.sha256sum" \
    && echo "$(cat helm-$VERSION-linux-$ARCH.tar.gz.sha256sum | awk '{ print $1 }')  helm-$VERSION-linux-$ARCH.tar.gz" | sha256sum -c \
    && tar -zxvf "helm-$VERSION-linux-$ARCH.tar.gz" \
    && install -o root -g root -m 0755 linux-$ARCH/helm /usr/local/bin/helm

# add helm-diff
RUN helm plugin install https://github.com/databus23/helm-diff && rm -rf /tmp/helm-*
RUN rm -r /tmp/*


# download and install k9s
RUN set -e && cd "$(mktemp -d)" && VERSION="$(wget https://github.com/derailed/k9s/releases/latest --server-response -O /dev/null 2>&1 | awk '/^\s*Location: /{DEST=$2} END{ print DEST}' | grep -oE '[^/]+$')" \
    && ARCH=$(dpkg --print-architecture) \
    && curl -LO https://github.com/derailed/k9s/releases/download/$VERSION/k9s_Linux_${ARCH}.tar.gz \
    && curl -LO https://github.com/derailed/k9s/releases/download/$VERSION/checksums.sha256 \
    && echo "$(cat checksums.sha256 | grep k9s_Linux_$ARCH.tar.gz$ | awk '{ print $1 }') k9s_Linux_$ARCH.tar.gz" | sha256sum -c \
    && tar -zxvf "k9s_Linux_$ARCH.tar.gz" \
    && install -o root -g root -m 0755 k9s /usr/local/bin/k9s

# copy over scripts + make executable
COPY ./scripts/. /usr/local/bin/
RUN chmod +x /usr/local/bin/*

RUN adduser --uid 832 --shell /bin/bash --disabled-password lab \
    && echo "lab ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/lab

USER lab

RUN set -x; cd "$(mktemp -d)" \
    && OS="$(uname | tr '[:upper:]' '[:lower:]')" \ 
    && ARCH="$(uname -m | sed -e 's/x86_64/amd64/' -e 's/\(arm\)\(64\)\?.*/\1\2/' -e 's/aarch64$/arm64/')" \
    && KREW="krew-${OS}_${ARCH}" \
    && curl -fsSLO "https://github.com/kubernetes-sigs/krew/releases/latest/download/${KREW}.tar.gz" \
    && tar zxvf "${KREW}.tar.gz" \
    && ./"${KREW}" install krew \
    && PATH="${KREW_ROOT:-$HOME/.krew}/bin:$PATH" kubectl krew install ns ctx tail

WORKDIR /home/lab

RUN mkdir .kube && chown -R lab:lab .kube/

# copy over bash config
COPY ./bash_profile .bash_profile
COPY ./bashrc .bashrc

# copy in lab
COPY --chown=lab:lab --from=lab . /home/lab