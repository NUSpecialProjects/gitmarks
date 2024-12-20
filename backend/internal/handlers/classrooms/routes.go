package classrooms

import (
	"github.com/CamPlume1/khoury-classroom/internal/handlers/classrooms/assignments"
	"github.com/CamPlume1/khoury-classroom/internal/handlers/classrooms/assignments/works"
	"github.com/CamPlume1/khoury-classroom/internal/middleware"
	"github.com/CamPlume1/khoury-classroom/internal/types"
	"github.com/gofiber/fiber/v2"
)

func Routes(app *fiber.App, params types.Params) {
	classroomService := newClassroomService(params.Store, params.GitHubApp, &params.UserCfg)
	assignmentService := assignments.NewAssignmentService(params.Store, &params.UserCfg, params.GitHubApp)
	workService := works.NewWorkService(params.Store, &params.UserCfg, params.GitHubApp)

	// Create the base router
	baseRouter := app.Group("")

	// Create the classroom routes
	classroomRoutes(baseRouter, classroomService)

	// Create the assignment routes
	assignments.AssignmentRoutes(baseRouter, assignmentService, &params)

	// Create the submission routes
	works.WorkRoutes(baseRouter, workService)
}

func classroomRoutes(router fiber.Router, service *ClassroomService) fiber.Router {
	classroomRouter := router.Group(
		"/classrooms",
	).Use(middleware.Protected(service.userCfg.JWTSecret))

	// Get the classrooms the authenticated user is part of
	classroomRouter.Get("/", service.getUserClassrooms())

	// Get the details of a classroom
	classroomRouter.Get("/classroom/:classroom_id", service.getClassroom())

	// Create a classroom
	classroomRouter.Post("/", service.createClassroom())

	// Check if a classroom exists
	classroomRouter.Get("/check-classroom/:classroom_name", service.checkClassroomExists())

	// Update a classroom
	classroomRouter.Put("/classroom/:classroom_id", service.updateClassroom())

	// Update a classroom's name
	classroomRouter.Put("/classroom/:classroom_id/name", service.updateClassroomName())

	// Update a classroom's name
	classroomRouter.Put("/classroom/:classroom_id/name", service.updateClassroomName())

	// Get the users of this classroom
	classroomRouter.Get("/classroom/:classroom_id/students", service.getClassroomUsers())

	// Get all rubrics assoricated with this classroom
	classroomRouter.Get("/classroom/:classroom_id/rubrics", service.getRubricsInClassroom())

	// Send org invites to all requested users
	classroomRouter.Put("/classroom/:classroom_id/invite/role/:classroom_role", service.sendOrganizationInvitesToRequestedUsers())

	// Send org invites to a specific user
	classroomRouter.Put("/classroom/:classroom_id/invite/role/:classroom_role/user/:user_id", service.sendOrganizationInviteToUser())

	// Deny a requested user
	classroomRouter.Put("/classroom/:classroom_id/deny/user/:user_id", service.denyRequestedUser())

	// Revoke an invite to a user
	classroomRouter.Put("/classroom/:classroom_id/revoke/user/:user_id", service.revokeOrganizationInvite())

	// Remove a user from a classroom
	classroomRouter.Delete("/classroom/:classroom_id/students/:user_id", service.removeUserFromClassroom())

	// Generate a token to join this classroom
	classroomRouter.Post("/classroom/:classroom_id/token", service.generateClassroomToken())

	// Use a token to request to join a classroom
	classroomRouter.Post("/classroom/token/:token", service.useClassroomToken())

	// Get the current authenticated user + their role in the classroom
	classroomRouter.Get("/classroom/:classroom_id/user", service.getCurrentClassroomUser())

	classroomRouter.Get("/names", service.getClassroomNames())

	return classroomRouter
}
