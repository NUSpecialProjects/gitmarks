package webhooks

import (
	"github.com/CamPlume1/khoury-classroom/internal/config"
	"github.com/CamPlume1/khoury-classroom/internal/github"
	"github.com/CamPlume1/khoury-classroom/internal/storage"
)

type WebHookService struct {
	store     storage.Storage
	appClient github.GitHubAppClient
	domains   config.Domains
}

func newWebHookService(
	store storage.Storage,
	appClient github.GitHubAppClient,
	domains config.Domains,

) *WebHookService {
	return &WebHookService{
		store:     store,
		appClient: appClient,
		domains: domains,
	}
}
