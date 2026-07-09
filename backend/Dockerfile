FROM golang:latest AS builder

# Install gcc for CGO (required by mattn/go-sqlite3)
RUN apt-get update && apt-get install -y gcc libc6-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=1 GOOS=linux go build -o fstorage-api main.go

# ── Runtime stage (slim) ──
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/fstorage-api .

EXPOSE 8080

CMD ["./fstorage-api"]
