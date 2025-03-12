// main.go
package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"log/slog"

	"github.com/CamPlume1/khoury-classroom/internal/config"
	"github.com/CamPlume1/khoury-classroom/internal/github/appclient"
	"github.com/CamPlume1/khoury-classroom/internal/server"
	"github.com/CamPlume1/khoury-classroom/internal/storage/postgres"
	"github.com/CamPlume1/khoury-classroom/internal/types"
	"github.com/joho/godotenv"
)

func main() {
	ctx := context.Background()

	// Load environment variables if running locally
	if isLocal() {
		if err := godotenv.Load(".env"); err != nil {
			log.Fatalf("Unable to load environment variables necessary for application: %v", err)
		}
	}

	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Println(err.Error())
		log.Fatalf("Unable to load configuration: %v", err)
	}

	// Initialize the database connection pool
	db, err := postgres.New(ctx, cfg.Database)
	if err != nil {
		log.Fatalf("Failed to establish database connection: %v", err)
	}
	defer db.Close(context.Background())

	// Initialize GitHub App Client
	GitHubApp, err := appclient.New(&cfg.GitHubAppClient)
	if err != nil {
		log.Fatalf("Unable to establish connection with GitHub: %v", err)
	}

	// Initialize the server
	app := server.New(types.Params{
		Store:     db,
		GitHubApp: GitHubApp,
		UserCfg:   cfg.GitHubUserClient,
	})

	// Start the server in a separate goroutine
	go func() {
		if err := app.Listen(":8080"); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Block until interrupt signals
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	// Begin shutdown process
	slog.Info("Shutting down server")
	if err := app.Shutdown(); err != nil {
		slog.Error("Failed to shutdown server", "error", err)
	}

	slog.Info("Server shutdown complete")
}

func isLocal() bool {
	return os.Getenv("APP_ENVIRONMENT") == "LOCAL"
}
