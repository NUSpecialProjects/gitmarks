package users

import (
	"net/http"

	"github.com/CamPlume1/khoury-classroom/internal/errs"
	"github.com/CamPlume1/khoury-classroom/internal/middleware"
	"github.com/gofiber/fiber/v2"
)

func (s *UserService) GetUser() fiber.Handler {
	return func(c *fiber.Ctx) error {
		client, err := middleware.GetClient(c, s.store, s.userCfg)
		if err != nil {
			return errs.AuthenticationError()
		}

		userName := c.Params("user_name")
		if userName == "" {
			return errs.BadRequest(err)
		}

		githubUser, err := client.GetUser(c.Context(), userName)
		if err != nil {
			return errs.AuthenticationError()
		}

		user, err := s.store.GetUserByGitHubID(c.Context(), *githubUser.ID)
		if err != nil {
			return errs.AuthenticationError()
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{
			"user":        user,
			"github_user": githubUser,
		})
	}
}
