################################################################################
# Build stage: Compile the Go application.
################################################################################
ARG GO_VERSION=1.23
FROM --platform=$BUILDPLATFORM golang:${GO_VERSION}-alpine AS build

# Set the working directory for the build
WORKDIR /workspace

# Cache Go module
RUN --mount=type=cache,target=/go/pkg/mod/ \
    --mount=type=bind,source=go.sum,target=/workspace/go.sum \
    --mount=type=bind,source=go.mod,target=/workspace/go.mod \
    go mod download

# Build the application
ARG TARGETARCH
RUN --mount=type=cache,target=/go/pkg/mod/ \
    --mount=type=bind,target=. \
    CGO_ENABLED=0 GOARCH=$TARGETARCH go build -o /bin/server ./cmd/server/main.go

################################################################################
# Final stage: Run the application using a minimal runtime environment.
################################################################################
FROM alpine:latest AS final

# Install runtime dependencies
RUN --mount=type=cache,target=/var/cache/apk \
    apk --update add ca-certificates tzdata \
    && update-ca-certificates

# Create a non-privileged user to run the app
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

# Set the working directory for the final stage
WORKDIR /root/

# Copy the compiled Go binary from the build stage
COPY --from=build /bin/server /bin/server

# Expose the port that the application will listen on
EXPOSE 8080

# Set the user to the non-privileged appuser
USER appuser

# Run the application
ENTRYPOINT [ "/bin/server" ]
