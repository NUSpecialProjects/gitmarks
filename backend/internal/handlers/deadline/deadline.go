package deadline

import (
	"fmt"
	"strings"
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

	// return true if the repo is overdue, false if not
	return c.Status(fiber.StatusOK).JSON(map[string]bool{"overdue": due.Before(time.Now())})

}


func (s *DeadlineService) IndividualExtensionHandler(c *fiber.Ctx) error {
	return c.Status(fiber.StatusOK).JSON("Stub")
}


func (s *DeadlineService) AssignmentExtensionHandler(c *fiber.Ctx) error {
	fmt.Printf("Correct Handler reached")

	// Define a struct to parse the request body
	type RequestBody struct {
		NewDate string `json:"newDate"`
		AssignmentID int `json:"assignmentID"`
	}

	// Parse the JSON request body
	var reqBody RequestBody
	if err := c.BodyParser(&reqBody); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Parse the newDate string into a time.Time object @TODO fix time parsing parament
	newDate, err := time.Parse(time.RFC1123, strings.TrimSpace(reqBody.NewDate))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid date format"})
	}

	err = s.store.UpdateAssignmentDeadline(c.Context(), reqBody.AssignmentID, &newDate)
	if err != nil {
		fmt.Printf("Consider changing professions")
		fmt.Printf(err.Error())
	}
	// Return the parsed date in the response
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"newDate": newDate.Format(time.RFC3339)})
}