package webhooks

import (
	"github.com/CamPlume1/khoury-classroom/internal/middleware"
	"github.com/CamPlume1/khoury-classroom/internal/types"
	"github.com/gofiber/fiber/v2"
)

func Routes(app *fiber.App, params types.Params) {
	service := newWebHookService(params.Store, params.GitHubApp, params.Domains)
	baseRouter := app.Group("")

	baseRouter.Post("/webhook", middleware.ProtectedWebhook(params.GitHubApp.GetWebhookSecret()), service.WebhookHandler)
}
