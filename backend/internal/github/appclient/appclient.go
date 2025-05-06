package appclient

import (
	"context"
	"fmt"

	"github.com/CamPlume1/khoury-classroom/internal/config"
	"github.com/CamPlume1/khoury-classroom/internal/errs"
	"github.com/CamPlume1/khoury-classroom/internal/github/sharedclient"
	"github.com/CamPlume1/khoury-classroom/internal/models"
	"github.com/google/go-github/github"
	"github.com/jferrl/go-githubauth"
	"golang.org/x/oauth2"
)

type AppAPI struct { //app API
	sharedclient.CommonAPI
	webhooksecret  string
	appTokenSource oauth2.TokenSource
}

func New(cfg *config.GitHubAppClient) (*AppAPI, error) {
	// Read private key and IDs from the config
	privateKey := []byte(cfg.Key)
	appID := cfg.AppID
	installationID := cfg.InstallationID

	// Create an Application Token Source
	appTokenSource, err := githubauth.NewApplicationTokenSource(appID, privateKey)
	if err != nil {
		return nil, fmt.Errorf("error creating application token source: %v", err)
	}

	// Create an Installation Token Source
	installationTokenSource := githubauth.NewInstallationTokenSource(installationID, appTokenSource)

	// Create an OAuth2 HTTP client
	httpClient := oauth2.NewClient(context.Background(), installationTokenSource)

	// Create the GitHub client
	githubClient := github.NewClient(httpClient)

	return &AppAPI{
		CommonAPI: sharedclient.CommonAPI{
			Client: githubClient,
		},
		webhooksecret:  cfg.WebhookSecret,
		appTokenSource: appTokenSource,
	}, nil
}

func (api *AppAPI) GetWebhookSecret() string {
	return api.webhooksecret
}

// GetJWT generates a JWT from the appTokenSource
func (api *AppAPI) getJWT() (string, error) {
	token, err := api.appTokenSource.Token()
	if err != nil {
		return "", fmt.Errorf("error getting token: %v", err)
	}
	return token.AccessToken, nil
}

func (api *AppAPI) getClientWithJWTAuth(ctx context.Context) (*github.Client, error) {
	// Create a new OAuth2 client with the JWT
	token, err := api.getJWT()
	if err != nil {
		return nil, fmt.Errorf("error getting app JWT: %v", err)
	}

	ts := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: token},
	)
	tc := oauth2.NewClient(ctx, ts)

	// Create a new GitHub client with the authenticated HTTP client
	return github.NewClient(tc), nil
}

func (api *AppAPI) ListInstallations(ctx context.Context) ([]*github.Installation, error) {
	client, err := api.getClientWithJWTAuth(ctx)
	if err != nil {
		return nil, fmt.Errorf("error getting github client with JWT auth: %v", err)
	}

	// List installations
	installations, _, err := client.Apps.ListInstallations(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("error listing installations: %v", err)
	}

	return installations, nil
}

func (api *AppAPI) AssignPermissionToTeam(ctx context.Context, teamID int64, ownerName string, repoName string, permission string) error {
	opt := &github.TeamAddTeamRepoOptions{
		Permission: permission,
	}

	_, err := api.Client.Teams.AddTeamRepo(ctx, teamID, ownerName, repoName, opt)
	if err != nil {
		return fmt.Errorf("error assigning permission to team: %v", err)
	}

	return nil
}

func (api *AppAPI) AssignPermissionToUser(ctx context.Context, ownerName string, repoName string, userName string, permission string) error {
	opt := &github.RepositoryAddCollaboratorOptions{
		Permission: permission,
	}

	_, err := api.Client.Repositories.AddCollaborator(ctx, ownerName, repoName, userName, opt)
	if err != nil {
		return fmt.Errorf("error assigning permission to user: %v", err)
	}

	return nil
}

func (api *AppAPI) CreateRepoFromTemplate(ctx context.Context, templateRepoOwner, templateRepoName, newRepoOwner, newRepoName string) (*models.AssignmentBaseRepo, error) {
	endpoint := fmt.Sprintf("/repos/%s/%s/generate", templateRepoOwner, templateRepoName)

	// Construct the request
	req, err := api.Client.NewRequest("POST", endpoint, map[string]interface{}{
		"name":    newRepoName,
		"owner":   newRepoOwner,
		"private": true,
	})
	if err != nil {
		return nil, errs.GithubAPIError(err)
	}

	// Execute the request
	var repo *models.Repository
	_, err = api.Client.Do(ctx, req, &repo)
	if err != nil {
		return nil, errs.GithubAPIError(err)
	}

	return &models.AssignmentBaseRepo{
		BaseRepoOwner: newRepoOwner,
		BaseRepoName:  newRepoName,
		BaseID:        repo.ID,
	}, nil
}
