package types

import (
	"github.com/CamPlume1/khoury-classroom/internal/config"
	"github.com/CamPlume1/khoury-classroom/internal/github"
	"github.com/CamPlume1/khoury-classroom/internal/storage"
)

type Params struct {
	UserCfg   config.GitHubUserClient
	Store     storage.Storage
	GitHubApp github.GitHubAppClient
	Domains config.Domains
}
