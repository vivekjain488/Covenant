# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN go build -o node ./cmd/node/

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates openssl

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/node .
COPY --from=builder /app/node-config.json .

# Generate a new ephemeral node identity on boot if none exists
RUN openssl genpkey -algorithm ed25519 -out private.pem

EXPOSE 9002

ENTRYPOINT ["./node"]
CMD ["-config", "node-config.json"]
