# as of right now we need to build the dependency ascinema-player from scratch and unforunately it's WASM

# pulling in Rust build tools from a pre-build image to keep things simple
FROM rust:alpine as rust
FROM node:lts-alpine as builder
COPY --from=rust /usr/local/cargo /usr/local/cargo
COPY --from=rust /usr/local/rustup /usr/local/rustup
ENV RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    PATH=/usr/local/cargo/bin:$PATH

# adding wasm target as that's what we're building
RUN rustup target add wasm32-unknown-unknown

# adding packages for compilation
RUN apk add --no-cache gcc musl-dev

# set workdir to something reasonable
WORKDIR /home/node/
COPY package*.json .

# build our own wasm-bindgen-cli and trick rust rollup plugin to use it due to issues with
# the ARM version of wasm-bindgen-cli on Alpine (dynamically links to non-existent libs)
# note that the wasm-bindgen version needs to be the same as the one in 
# https://github.com/devinchristianson/asciinema-player/blob/develop/src/vt/Cargo.toml
RUN WASM_BINDGEN_VERSION="0.2.84" && apk add git openssl-dev build-base \
    && RUSTFLAGS='-C target-feature=-crt-static' cargo install -f wasm-bindgen-cli --version $WASM_BINDGEN_VERSION \
    && mkdir -p /root/.cache/rollup-plugin-rust/wasm-bindgen-${WASM_BINDGEN_VERSION}-aarch64-unknown-linux-gnu/ \
    && ln /usr/local/cargo/bin/wasm-bindgen /root/.cache/rollup-plugin-rust/wasm-bindgen-${WASM_BINDGEN_VERSION}-aarch64-unknown-linux-gnu/wasm-bindgen

# running install & build
RUN npm ci

# copying in source files
COPY . .
RUN npm run build

# minify node_modules
RUN npm prune --production

FROM node:lts-alpine as prod

# set workdir to something reasonable again
WORKDIR /home/node/

# move everything over to a clean image
COPY --from=builder /home/node/dist/ .
COPY --from=builder /home/node/node_modules/ ./node_modules
COPY --from=builder /home/node/package.json .

ENV NODE_ENV=production
EXPOSE 3001
CMD ["/home/node/backend/index.js"]