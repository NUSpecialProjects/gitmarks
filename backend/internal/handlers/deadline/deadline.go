package deadline

import (
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
	due, err := s.store.GetDeadlineForRepo(repo)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON("Bad Request")
	}

	// return true if the repo is overdue, false if not
	if due < time.Now(){
		return c.Status(fiber.StatusOK).JSON(map[string]bool{"overdue": false})
	} else {return c.Status(fiber.StatusOK).JSON(map[string]bool{"overdue": false})}

	
}