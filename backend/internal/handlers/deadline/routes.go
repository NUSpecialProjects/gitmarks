package deadline

import (
	"github.com/CamPlume1/khoury-classroom/internal/types"
	"github.com/gofiber/fiber/v2"
)

func Routes(app *fiber.App, params types.Params) {
	service := newDeadlineService(params.Store)
	baseRouter := app.Group("")

	baseRouter.Get("/overdue/:repo",  service.DeadlineHandler)


	baseRouter.Post("/extension/assignment", service.AssignmentExtensionHandler)
	
	baseRouter.Post("/extension/individual", service.IndividualExtensionHandler)
}
