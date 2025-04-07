package config

import "github.com/caarlos0/env/v11"

type Config struct {
	Database         `envPrefix:"DATABASE_"`
	GitHubAppClient  `envPrefix:"APP_"`
	GitHubUserClient `envPrefix:"CLIENT_"`
	Domains 		 `envPrefix:"DOMAINS_"`
}

func LoadConfig() (Config, error) {
	return env.ParseAs[Config]()
}
