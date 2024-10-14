include .env

# Installing frontend dependencies
.PHONY: frontend-dep
frontend-dep:
	cd frontend && npm install

# running the frontend
.PHONY: frontend-run
frontend-run:
	cd frontend && npm run dev

# Lint the frontend source code
.PHONY: frontend-lint
frontend-lint:
	cd frontend && npx eslint

# Run database
.PHONY: db-run
db-run:
	docker-compose up

# convert the backend link to an ngrok link
.PHONY: backend-ngrok
backend-ngrok:
	@echo ${PUBLIC_API_DOMAIN}
	cd backend && ngrok http --domain=${PUBLIC_API_DOMAIN} 8080
