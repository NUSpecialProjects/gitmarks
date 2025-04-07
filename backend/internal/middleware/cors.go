package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/CamPlume1/khoury-classroom/internal/config"
)

func Cors(domains config.Domains) fiber.Handler {
	allowedOrigins := domains.FRONTEND_URL

	if (allowedOrigins == "") {
		allowedOrigins = "https://gitmarks.org"
	}

	return cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     "GET, POST, PUT, PATCH, DELETE, OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Authorization, Accept, Set-Cookie",
		AllowCredentials: true,
	})
}
