package github

import (
	"github.com/CamPlume1/khoury-classroom/internal/config"
	"github.com/CamPlume1/khoury-classroom/internal/storage"
)

type GithubService struct {
	store   storage.Storage
	userCfg *config.GitHubUserClient
}

func newGithubService(
	store storage.Storage,
	userCfg *config.GitHubUserClient,
) *GithubService {
	return &GithubService{
		store:   store,
		userCfg: userCfg,
	}
}
