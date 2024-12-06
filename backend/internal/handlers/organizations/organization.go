package organizations

import (
	"strconv"
	"strings"

	"github.com/CamPlume1/khoury-classroom/internal/errs"
	"github.com/CamPlume1/khoury-classroom/internal/middleware"
	"github.com/CamPlume1/khoury-classroom/internal/models"
	"github.com/gofiber/fiber/v2"
)

func (service *OrganizationService) GetOrgsAndClassrooms() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Implement logic here
		return c.SendStatus(fiber.StatusNotImplemented)
	}
}

//Get all organizations a user is in
func (service *OrganizationService) GetUserOrgs() fiber.Handler {
	return func(c *fiber.Ctx) error {
		client, err := middleware.GetClient(c, service.store, service.userCfg)
		if err != nil {
			return errs.GithubClientError(err)
		}

		// Retrieve orgs from user client
		orgs, err := client.GetUserOrgs(c.Context())
		if err != nil {
			return errs.GithubAPIError(err)
		}
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"orgs": orgs})
	}
}

func (service *OrganizationService) GetInstalledOrgs() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get the user client
		userClient, err := middleware.GetClient(c, service.store, service.userCfg)
		if err != nil {
			return errs.GithubClientError(err)
		}
		// Get the app client
		appClient := service.appClient

		// Get the list of organizations the user is part of
		userOrgs, err := userClient.GetUserOrgs(c.Context())
		if err != nil {
			return errs.GithubAPIError(err)
		}

		// Get the list of installations of the GitHub app
		appInstallations, err := appClient.ListInstallations(c.Context())
		if err != nil {
			return errs.GithubAPIError(err)
		}

		// Filter the organizations to include only those with the app installed
		var orgsWithAppInstalled []models.Organization
		var orgsWithoutAppInstalled []models.Organization
		for _, org := range userOrgs {
			found := false
			for _, installation := range appInstallations {
				if *installation.Account.Login == org.Login {
					orgsWithAppInstalled = append(orgsWithAppInstalled, org)
					found = true
					break
				}
			}
			if !found {
				orgsWithoutAppInstalled = append(orgsWithoutAppInstalled, org)
			}
		}
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"orgs_with_app":    orgsWithAppInstalled,
			"orgs_without_app": orgsWithoutAppInstalled,
		})
	}
}

func (service *OrganizationService) GetOrg() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Extract org_id from the path
		orgName := c.Params("org_name")
		if orgName == "" || orgName == "undefined" {
			return errs.MissingAPIParamError("org_name")
		}

		// Get the user client
		userClient, err := middleware.GetClient(c, service.store, service.userCfg)
		if err != nil {
			return errs.GithubClientError(err)
		}

		// Get the organization
		org, err := userClient.GetOrg(c.Context(), orgName)
		if err != nil {
			return errs.GithubAPIError(err)
		}
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"org": org})
	}
}

func (service *OrganizationService) GetClassroomsInOrg() fiber.Handler {
	return func(c *fiber.Ctx) error {
		orgID, err := strconv.ParseInt(c.Params("org_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		client, err := middleware.GetClient(c, service.store, service.userCfg)
		if err != nil {
			return errs.GithubClientError(err)
		}

		currentGitHubUser, err := client.GetCurrentUser(c.Context())
		if err != nil {
			return errs.GithubAPIError(err)
		}

		user, err := service.store.GetUserByGitHubID(c.Context(), currentGitHubUser.ID)
		if err != nil {
			return errs.NewDBError(err)
		}

		classrooms, err := service.store.GetUserClassroomsInOrg(c.Context(), orgID, *user.ID)
		if err != nil {
			return err
		}

		// Get the user's org list (work around since we only know the org_id)
		orgs, err := client.GetUserOrgs(c.Context())
		if err != nil {
			return errs.GithubAPIError(err)
		}

		var orgName string
		for _, org := range orgs {
			if org.ID == orgID {
				orgName = org.Login
				break
			}
		}

		// Get the user's membership in the organization
		membership, err := client.GetCurrUserOrgMembership(c.Context(), orgName)
		if err != nil {
			return errs.NewDBError(err)
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"classrooms": classrooms,
			"org_role":   strings.ToUpper(*membership.Role),
		})
	}
}

func (service *OrganizationService) GetOrgTemplateRepos() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Extract org_id from the path
		orgName := c.Params("org_name")
		if orgName == "" || orgName == "undefined" {
			return errs.MissingAPIParamError("org_name")
		}

		// Parse pagination parameters
		itemsPerPage, err := strconv.Atoi(c.Query("items_per_page"))
		if err != nil {
			return errs.MissingAPIParamError("items_per_page")
		}
		pageNum, err := strconv.Atoi(c.Query("page_num"))
		if err != nil {
			return errs.MissingAPIParamError("page_num")
		}

		// Get the user client
		userClient, err := middleware.GetClient(c, service.store, service.userCfg)
		if err != nil {
			return errs.GithubClientError(err)
		}

		// Get the organizations repos and filter for template repos
		repos, err := userClient.ListRepositoriesByOrg(c.Context(), orgName, itemsPerPage, pageNum)
		if err != nil {
			return errs.GithubAPIError(err)
		}

		var templateRepos []models.AssignmentTemplate
		for _, repo := range repos {
			if repo.IsTemplate && !repo.Archived {
				templateRepo := models.AssignmentTemplate{
					TemplateRepoOwner: repo.Owner.Login,
					TemplateRepoName:  repo.Name,
					TemplateID:        repo.ID,
				}
				templateRepos = append(templateRepos, templateRepo)

				// Store the template locally if it doesn't already exist
				if exists, err := service.store.AssignmentTemplateExists(c.Context(), repo.ID); err != nil {
					return errs.NewDBError(err)
				} else if !exists {
					_, err := service.store.CreateAssignmentTemplate(c.Context(), templateRepo)
					if err != nil {
						return errs.NewDBError(err)
					}
				}
			}
		}

		return c.Status(200).JSON(fiber.Map{"templates": templateRepos})
	}
}

