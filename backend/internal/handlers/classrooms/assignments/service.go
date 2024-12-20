package assignments

import (
	"github.com/CamPlume1/khoury-classroom/internal/config"
	"github.com/CamPlume1/khoury-classroom/internal/github"
	"github.com/CamPlume1/khoury-classroom/internal/middleware"
	"github.com/CamPlume1/khoury-classroom/internal/storage"
)

type AssignmentService struct {
	store storage.Storage
	userCfg *config.GitHubUserClient
	appClient github.GitHubAppClient
	middleware.RoleChecker[AssignmentService]
}

func NewAssignmentService(store storage.Storage, userCfg *config.GitHubUserClient, appClient github.GitHubAppClient) *AssignmentService {
	service := &AssignmentService{store: store, userCfg: userCfg, appClient: appClient}
	service.RoleChecker = middleware.RoleChecker[AssignmentService]{Checkable: service}
	return service
}

// Getter for store field
func (s *AssignmentService) GetStore() storage.Storage {
	return s.store
}

// Getter for appClient field
func (s *AssignmentService) GetAppClient() github.GitHubAppClient {
	return s.appClient
}

// Getter for userCfg field
func (s *AssignmentService) GetUserCfg() *config.GitHubUserClient {
	return s.userCfg
}
