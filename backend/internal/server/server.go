package server

import (
	"github.com/CamPlume1/khoury-classroom/internal/errs"
	"github.com/CamPlume1/khoury-classroom/internal/handlers/auth"
	"github.com/CamPlume1/khoury-classroom/internal/handlers/classrooms"
	"github.com/CamPlume1/khoury-classroom/internal/handlers/deadline"
	"github.com/CamPlume1/khoury-classroom/internal/handlers/hello"
	"github.com/CamPlume1/khoury-classroom/internal/handlers/organizations"
	"github.com/CamPlume1/khoury-classroom/internal/handlers/rubrics"
	"github.com/CamPlume1/khoury-classroom/internal/handlers/test"
	"github.com/CamPlume1/khoury-classroom/internal/handlers/users"
	"github.com/CamPlume1/khoury-classroom/internal/handlers/webhooks"
	"github.com/CamPlume1/khoury-classroom/internal/middleware"
	"github.com/CamPlume1/khoury-classroom/internal/types"
	go_json "github.com/goccy/go-json"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/fiber/v2/middleware/requestid"
)

func New(params types.Params) *fiber.App {
	app := setupApp()

	useMiddlewares(app)

    // Route Groupings
    hello.Routes(app, params)
	deadline.Routes(app, params)
	auth.Routes(app, params)
	organizations.Routes(app, params)
	classrooms.Routes(app, params)
	test.Routes(app, params)
	webhooks.Routes(app, params)
	users.Routes(app, params)
    rubrics.Routes(app, params)

	// heartbeat route
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Hello, World!")
	})

	return app
}

func useMiddlewares(app *fiber.App) {
	app.Use(middleware.Cors())
}

func setupApp() *fiber.App {
	app := fiber.New(fiber.Config{
		JSONEncoder:  go_json.Marshal,
		JSONDecoder:  go_json.Unmarshal,
		ErrorHandler: errs.ErrorHandler,
	})
	app.Use(recover.New())
	app.Use(requestid.New())
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${ip}:${port} ${pid} ${locals:requestid} ${status} - ${latency} ${method} ${path}\n",
	}))
	app.Use(compress.New(compress.Config{
		Level: compress.LevelBestSpeed,
	}))

	return app
}
