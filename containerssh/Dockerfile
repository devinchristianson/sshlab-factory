FROM golang:1.21 as builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY . . 
RUN CGO_ENABLED=0 GOOS=linux go build -v -o /app/bin/main

FROM alpine:latest
COPY --from=builder /app/bin/main /containerssh
COPY ./containerssh /containerssh

ENTRYPOINT ["/containerssh"]