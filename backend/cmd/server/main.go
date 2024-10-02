package main

import (
	"context"
	"log"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/CamPlume1/khoury-classroom/internal/config"
	"github.com/CamPlume1/khoury-classroom/internal/github/api"
	"github.com/CamPlume1/khoury-classroom/internal/server"
	"github.com/CamPlume1/khoury-classroom/internal/storage/postgres"
	"github.com/CamPlume1/khoury-classroom/internal/types"
	"github.com/joho/godotenv"
)

func main() {
	ctx := context.Background()

	if isLocal() {
		if err := godotenv.Load("../../../.env"); err != nil {
			log.Fatalf("Error loading .env file: %v", err)
		}
	}

	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Unable to load environment variables necessary for application")
	}

	db, err := postgres.New(ctx, cfg.Database)
	if err != nil {
		log.Fatalf("Unable to load environment variables necessary for application 2")
	}

  //err = db.Close(ctx) 
  //if err != nil {
  //  log.Fatalf("Unable to close db")
  //}
	
  GithubApi, err := api.New(&cfg.GitHub)

	app := server.New(types.Params{
		AuthHandler: cfg.AuthHandler,
		Store:    db,
		Github: GithubApi,
	})

	go func() {
		if err := app.Listen(":8080"); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	<-quit

	slog.Info("Shutting down server")
	if err := app.Shutdown(); err != nil {
		slog.Error("failed to shutdown server", "error", err)
	}

	slog.Info("Server shutdown")
}

func isLocal() bool {
	return os.Getenv("APP_ENVIRONMENT") != "production"
}
