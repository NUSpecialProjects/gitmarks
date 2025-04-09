package deadline

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
)

func (s *DeadlineService) DeadlineHandler(c *fiber.Ctx) error {
	repo := c.Params("repo")
	if repo == "" {
		// Intentionally unhelpful as this is a public endpoint
		return c.Status(fiber.StatusBadRequest).JSON("Bad Request")
	}
	// Retrieve Deadline from DB
	due, err := s.store.GetDeadlineForRepo(c.Context(), repo)
	if err != nil {
		fmt.Printf(err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON("Error Retrieving Assignment Deadline")
	}

	// If no deadline is set, return false
	if due == nil {
		return c.Status(fiber.StatusOK).JSON(map[string]bool{"overdue": false})
	}

	// return true if the repo is overdue, false if not
	return c.Status(fiber.StatusOK).JSON(map[string]bool{"overdue": due.Before(time.Now())})

}
