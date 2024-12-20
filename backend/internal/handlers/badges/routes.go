package badges

import (
	"github.com/CamPlume1/khoury-classroom/internal/types"
	"github.com/gofiber/fiber/v2"
)

func Routes(app *fiber.App, params types.Params) {
	badgeService := NewBadgesService(params.Store)

	// Create the base router
	baseRouter := app.Group("")

	// Create badge routes
	badgeRoutes(baseRouter, badgeService)
}

func badgeRoutes(router fiber.Router, service *BadgesService) fiber.Router {
	badgeRouter := router.Group("/public/badges")

	// Get user badge
	badgeRouter.Get("/users/:user_id", service.GetUsersBadge())

	// Get classroom badge
	badgeRouter.Get("/classrooms/:classroom_id", service.GetClassroomsBadge())

	// Get assignment badge
	badgeRouter.Get("/assignments/:assignment_id", service.GetAssignmentsBadge())

	return badgeRouter
}
