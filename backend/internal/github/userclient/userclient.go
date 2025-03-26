package userclient

import (
	"context"
	"fmt"

	"github.com/CamPlume1/khoury-classroom/internal/config"
	"github.com/CamPlume1/khoury-classroom/internal/errs"
	"github.com/CamPlume1/khoury-classroom/internal/github/sharedclient"
	"github.com/CamPlume1/khoury-classroom/internal/models"
	"github.com/google/go-github/github"
	"golang.org/x/oauth2"
)

type UserAPI struct {
	sharedclient.CommonAPI
	Token *oauth2.Token
}

func NewFromCode(cfg *config.GitHubUserClient, code string) (*UserAPI, error) {
	oAuthCfg := cfg.OAuthConfig()

	token, err := oAuthCfg.Exchange(context.Background(), code)
	if err != nil {
		return nil, err
	}

	return newFromToken(oAuthCfg, token)
}

func NewFromSession(oAuthCfg *oauth2.Config, session *models.Session) (*UserAPI, error) {
	token := session.CreateToken()
	return newFromToken(oAuthCfg, &token)
}

func newFromToken(oAuthCfg *oauth2.Config, token *oauth2.Token) (*UserAPI, error) {
	httpClient := oAuthCfg.Client(context.Background(), token)

	// Create the GitHub client
	githubClient := github.NewClient(httpClient)

	return &UserAPI{
		CommonAPI: sharedclient.CommonAPI{
			Client: githubClient,
		},
		Token: token,
	}, nil
}

func (api *UserAPI) GetCurrentUser(ctx context.Context) (models.GitHubUser, error) {
	endpoint := "https://api.github.com/user"

	var user models.GitHubUser

	// Create a new GET request
	req, err := api.Client.NewRequest("GET", endpoint, nil)
	if err != nil {
		return user, fmt.Errorf("error creating request: %v", err)
	}

	// Make the API call
	_, err = api.Client.Do(ctx, req, &user)
	if err != nil {
		return user, fmt.Errorf("error fetching current user: %v", err)
	}
	return user, nil
}

func (api *UserAPI) GetOrg(ctx context.Context, orgName string) (*models.Organization, error) {
	// Construct the URL for the org endpoint
	endpoint := fmt.Sprintf("/orgs/%s", orgName)

	// Create a new GET request
	req, err := api.Client.NewRequest("GET", endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	// Response container for organization
	var org models.Organization

	// Make the API call
	_, err = api.Client.Do(ctx, req, &org)
	if err != nil {
		return nil, fmt.Errorf("error fetching organization: %v", err)
	}

	return &org, nil
}

// Get the membership of the authenticated user to an organization (404 if not a member or invited)
func (api *UserAPI) GetCurrUserOrgMembership(ctx context.Context, orgName string) (*github.Membership, error) {
	endpoint := fmt.Sprintf("/user/memberships/orgs/%s", orgName)

	// Create a new GET requestd
	req, err := api.Client.NewRequest("GET", endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	var membership github.Membership

	_, err = api.Client.Do(ctx, req, &membership)
	if err != nil {
		return nil, fmt.Errorf("error fetching organization membership: %v", err)
	}

	return &membership, nil
}

// Accept an invitation to an organization
func (api *UserAPI) AcceptOrgInvitation(ctx context.Context, orgName string) error {
	endpoint := fmt.Sprintf("/user/memberships/orgs/%s", orgName)

	body := map[string]interface{}{
		"state": "active",
	}

	req, err := api.Client.NewRequest("PATCH", endpoint, body)
	if err != nil {
		return fmt.Errorf("error creating request: %v", err)
	}

	_, err = api.Client.Do(ctx, req, nil)
	if err != nil {
		return fmt.Errorf("error accepting organization invitation: %v", err)
	}

	return nil
}

func (api *UserAPI) ForkRepository(ctx context.Context, srcOwner, srcRepo, dstOrg, dstRepo string) error {
	endpoint := fmt.Sprintf("/repos/%s/%s/forks", srcOwner, srcRepo)

	body := map[string]interface{}{
		"organization":        dstOrg,
		"name":                dstRepo,
		"default_branch_only": false,
	}

	req, err := api.Client.NewRequest("POST", endpoint, body)
	if err != nil {
		return errs.GithubAPIError(err)
	}

	response, err := api.Client.Do(ctx, req, nil)
	if err != nil && response.StatusCode != 202 {
		return errs.GithubAPIError(err)
	}

	return nil
}

// SyncForkWithUpstream syncs a forked repository with its upstream repository
func (api *UserAPI) SyncForkWithUpstream(ctx context.Context, owner, repo string, branch string) error {
	endpoint := fmt.Sprintf("/repos/%s/%s/merge-upstream", owner, repo)

	body := map[string]interface{}{
		"branch": branch,
	}

	req, err := api.Client.NewRequest("POST", endpoint, body)
	if err != nil {
		return errs.GithubAPIError(err)
	}

	_, err = api.Client.Do(ctx, req, nil)
	if err != nil {
		return errs.GithubAPIError(err)
	}

	return nil
}

func (api *UserAPI) CreateFeedbackPR(ctx context.Context, owner, repo string) error {
	// get default branch
	ghRepo, err := api.GetRepository(ctx, owner, repo)
	if err != nil {
		fmt.Println("Error getting repository:", err)
		return err
	}
	if ghRepo.DefaultBranch == nil {
		fmt.Println("Missing default branch")
		return errs.MissingDefaultBranchError()
	}

	endpoint := fmt.Sprintf("/repos/%s/%s/pulls", owner, repo)

	//Initialize post request
	req, err := api.Client.NewRequest("POST", endpoint, map[string]interface{}{
		"title": "Feedback",
		"head":  owner + ":" + *ghRepo.DefaultBranch,
		"base":  "feedback",
		"body":  "Grade and feedback will be left here. Do not close or modify this PR!<br>Once graded, reply with a justification to any deduction you would like to dispute.",
	})
	if err != nil {
		fmt.Println("Error creating request:", err)
		return errs.GithubAPIError(err)
	}

	// Make the API call
	_, err = api.Client.Do(ctx, req, nil)
	if err != nil {
		fmt.Println("Error making API call:", err)
		return errs.GithubAPIError(err)
	}

	return nil
}

// Set branch to specific commit
func (api *UserAPI) SetBranchToCommit(ctx context.Context, owner, repo, branch, sha string) error {
	endpoint := fmt.Sprintf("/repos/%s/%s/git/refs/heads/%s", owner, repo, branch)

	body := map[string]interface{}{
		"sha":   sha,
		"force": true,
	}

	req, err := api.Client.NewRequest("PATCH", endpoint, body)
	if err != nil {
		return errs.GithubAPIError(err)
	}

	_, err = api.Client.Do(ctx, req, nil)
	if err != nil {
		return errs.GithubAPIError(err)
	}

	return nil
}
