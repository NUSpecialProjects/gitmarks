package organizations

import (
	"github.com/CamPlume1/khoury-classroom/internal/config"
	"github.com/CamPlume1/khoury-classroom/internal/github"
	"github.com/CamPlume1/khoury-classroom/internal/storage"
)


//Service Declaration
type OrganizationService struct {
	store     storage.Storage
	appClient github.GitHubAppClient
	userCfg   *config.GitHubUserClient
}

//Service constructor
func NewOrganizationService(
	store storage.Storage,
	appClient github.GitHubAppClient,
	userCfg *config.GitHubUserClient,
) *OrganizationService {
	service := &OrganizationService{store: store, appClient: appClient, userCfg: userCfg}
	return service
}
