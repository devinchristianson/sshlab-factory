FROM golang:1.22.0 as builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -v -o /app/bin/main

FROM scratch
# simplest way to get a /tmp dir in a from scratch container
COPY --from=builder /tmp /tmp 
COPY --from=builder /app/bin/main /app
COPY ./k3dconfig.yml /config.yml
EXPOSE 8090
CMD ["/app"]