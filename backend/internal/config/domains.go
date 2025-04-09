package config

type Domains struct {
	BACKEND_URL string `env:"BACKEND_URL"`
	FRONTEND_URL string `env:"FRONTEND_URL"`
}
