package server

import (
	"github.com/CamPlume1/khoury-classroom/internal/errs"
	github "github.com/CamPlume1/khoury-classroom/internal/handlers/github"
	khouryclassroomdb "github.com/CamPlume1/khoury-classroom/internal/handlers/khouryclassroomdb"
	hello "github.com/CamPlume1/khoury-classroom/internal/handlers/hello"
	"github.com/CamPlume1/khoury-classroom/internal/handlers/test"
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

	//Add Route Groupings here: @TODO
	hello.Routes(app, params)
	github.Routes(app, params)
	test.Routes(app, params)
	khouryclassroomdb.Routes(app, params)

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
