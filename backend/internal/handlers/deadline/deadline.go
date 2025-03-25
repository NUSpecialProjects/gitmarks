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
		return c.Status(fiber.StatusBadRequest).JSON("Bad Request: User Skill Issue")
	}
	// Retrieve Deadline from DB
	due, err := s.store.GetDeadlineForRepo(c.Context(), repo)
	if err != nil {
		fmt.Printf(err.Error())
		return c.Status(fiber.StatusBadRequest).JSON("Bad Request: Dev Team Skill Issue")
	}

	// return true if the repo is overdue, false if not
	if due.Before(time.Now()){
		return c.Status(fiber.StatusOK).JSON(map[string]bool{"overdue": false})
	} else {return c.Status(fiber.StatusOK).JSON(map[string]bool{"overdue": false})}

}