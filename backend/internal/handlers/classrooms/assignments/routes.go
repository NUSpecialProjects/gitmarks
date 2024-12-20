package assignments

import (
	"github.com/CamPlume1/khoury-classroom/internal/middleware"
	"github.com/CamPlume1/khoury-classroom/internal/types"
	"github.com/gofiber/fiber/v2"
)

func AssignmentRoutes(router fiber.Router, service *AssignmentService, params *types.Params) fiber.Router {
	assignmentRouter := router.Group(
		"/classrooms/classroom/:classroom_id/assignments",
	).Use(middleware.Protected(service.userCfg.JWTSecret))

	// Get the assignments in a classroom
	assignmentRouter.Get("/", service.getAssignments())

	// Generate a token to accept this assignment
	assignmentRouter.Post("/assignment/:assignment_id/token", service.generateAssignmentToken())

	// Use a token to accept an assignment
	assignmentRouter.Post("/token/:token", service.useAssignmentToken())

	// Get the details of an assignment
	assignmentRouter.Get("/assignment/:assignment_id", service.getAssignment())

	// Get the template of an assignment
	assignmentRouter.Get("/assignment/:assignment_id/template", service.getAssignmentTemplate())

	// Create an assignment
	assignmentRouter.Post("/", service.createAssignment())

	// Update an assignment rubric
	assignmentRouter.Put("/assignment/:assignment_id/rubric", service.updateAssignmentRubric())

	// Get the rubric and rubric items attached to an assignment
	assignmentRouter.Get("/assignment/:assignment_id/rubric", service.getAssignmentRubric())

	// Check if an assignment name exists
	assignmentRouter.Get("/assignment/:assignment_name/exists", service.checkAssignmentName())

	// Get the number of student works that have been graded
	assignmentRouter.Get("/assignment/:assignment_id/grading-status", service.getGradedCount())

	// Get the status of student works for an assignment
	assignmentRouter.Get("/assignment/:assignment_id/progress-status", service.getAssignmentStatus())

	// Get the first commit date of any student work for this assignment
	assignmentRouter.Get("/assignment/:assignment_id/first-commit", service.GetFirstCommitDate())

	// Get the total number of commits in all student works for this assignment
	assignmentRouter.Get("/assignment/:assignment_id/commit-count", service.GetCommitCount())

	return assignmentRouter
}
