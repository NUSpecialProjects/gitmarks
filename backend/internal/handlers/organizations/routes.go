package organizations

import (
	"github.com/CamPlume1/khoury-classroom/internal/middleware"
	"github.com/CamPlume1/khoury-classroom/internal/types"
	"github.com/gofiber/fiber/v2"
)

func Routes(app *fiber.App, params types.Params) {
	organizationService := NewOrganizationService(params.Store, params.GitHubApp, &params.UserCfg)

	// Create the base router
	baseRouter := app.Group("")

	OrgRoutes(baseRouter, organizationService)
}

func OrgRoutes(router fiber.Router, service *OrganizationService) fiber.Router {
	// Create the organization router with authentication middleware
	orgRouter := router.Group("/orgs").Use(middleware.Protected(service.userCfg.JWTSecret))

	// Get the organizations of the authenticated user
	orgRouter.Get("/", service.GetUserOrgs())

	// Get the classrooms in an organization that the authenticated user is a part of
	orgRouter.Get("/org/:org_id/classrooms", service.GetClassroomsInOrg())

	// Get the organizations the authenticated user is part of that have the app installed
	orgRouter.Get("/installations", service.GetInstalledOrgs())

	// Get the details of an organization
	orgRouter.Get("/org/:org_name", service.GetOrg())

	// Get the template repositries of an organization
	orgRouter.Get("/org/:org_name/templates", service.GetOrgTemplateRepos())

	return orgRouter
}
