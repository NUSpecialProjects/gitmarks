package github

import (
	"github.com/CamPlume1/khoury-classroom/internal/middleware"
	"github.com/CamPlume1/khoury-classroom/internal/types"
	"github.com/gofiber/fiber/v2"
)

func Routes(app *fiber.App, params types.Params) {
	githubService := newGithubService(params.Store, &params.UserCfg)

	// Create the base router
	baseRouter := app.Group("")

	GitHubRoutes(baseRouter, githubService)
}

func GitHubRoutes(router fiber.Router, service *GithubService) fiber.Router {
	// Create the github router with authentication middleware
	githubRouter := router.Group("/github").Use(middleware.Protected(service.userCfg.JWTSecret))

	// Get a repository from github
	githubRouter.Get("/repo/:repo_owner/:repo_name", service.getRepoFromGithub())

	return githubRouter
}
