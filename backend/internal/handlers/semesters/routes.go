package semesters

import (
	"github.com/CamPlume1/khoury-classroom/internal/handlers/semesters/assignments"
	"github.com/CamPlume1/khoury-classroom/internal/types"
	"github.com/gofiber/fiber/v2"
)

func Routes(app *fiber.App, params types.Params) {
	protected := app.Group("/semesters/:classroomID")
	assignments.Routes(protected, params)
}