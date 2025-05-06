package github

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/CamPlume1/khoury-classroom/internal/errs"
	"github.com/CamPlume1/khoury-classroom/internal/middleware"
	"github.com/gofiber/fiber/v2"
)

// Returns a repository from github
func (s *GithubService) getRepoFromGithub() fiber.Handler {
	return func(c *fiber.Ctx) error {
		repoOwner := c.Params("repo_owner")
		repoName := c.Params("repo_name")

		// Validate input parameters
		if repoOwner == "" || repoName == "" {
			return errs.BadRequest(errors.New("repository owner and name are required"))
		}

		// Get authenticated client
		client, _, _, err := middleware.GetClientAndUser(c, s.store, s.userCfg)
		if err != nil {
			return errs.AuthenticationError()
		}

		// Try to get the repository
		repo, err := client.GetRepository(c.Context(), repoOwner, repoName)
		if err != nil {
			fmt.Println("error getting repository:", err)
			return c.Status(http.StatusNotFound).JSON(fiber.Map{
				"error": "Repository not found",
			})
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{
			"repository": repo,
		})
	}
}
