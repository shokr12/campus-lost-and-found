# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/server/main.go

# Final stage
FROM alpine:latest

WORKDIR /app

# Install certificates for HTTPS requests if needed
RUN apk --no-cache add ca-certificates

# Copy the binary and .env
COPY --from=builder /app/main .
# Note: In docker-compose we'll likely bind-mount or copy context for DB access
# But for absolute production, we'd copy the migrations too.

EXPOSE 8080

CMD ["./main"]
