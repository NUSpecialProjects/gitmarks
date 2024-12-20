package sharedclient

import (
	"context"
	"encoding/base64"
	"fmt"
	"time"
	"github.com/CamPlume1/khoury-classroom/internal/errs"
	"github.com/CamPlume1/khoury-classroom/internal/models"
	"github.com/CamPlume1/khoury-classroom/internal/utils"
	"github.com/google/go-github/github"
)

type CommonAPI struct {
	Client *github.Client
}

func (api *CommonAPI) Ping(ctx context.Context) (string, error) {
	message, _, err := api.Client.Zen(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to ping GitHub API: %v", err)
	}

	return message, nil
}

func (api *CommonAPI) ListRepositoriesByOrg(ctx context.Context, orgName string, itemsPerPage int, pageNum int) ([]*models.Repository, error) {
	// Construct the request
	endpoint := fmt.Sprintf("/orgs/%s/repos?per_page=%d&page=%d", orgName, itemsPerPage, pageNum)
	req, err := api.Client.NewRequest("GET", endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	// Execute the request
	var repos []*models.Repository
	_, err = api.Client.Do(ctx, req, &repos)
	if err != nil {
		return nil, fmt.Errorf("error fetching repositories: %v", err)
	}

	return repos, nil
}

func (api *CommonAPI) ListCommits(ctx context.Context, owner string, repo string, opts *github.CommitsListOptions) ([]*github.RepositoryCommit, error) {
	commits, _, err := api.Client.Repositories.ListCommits(ctx, owner, repo, opts)

	return commits, err
}

func (api *CommonAPI) getBranchHead(ctx context.Context, owner, repo, branchName string) (*github.Reference, error) {
	endpoint := fmt.Sprintf("/repos/%s/%s/git/refs/heads/%s", owner, repo, branchName)

	// Create a new GET request
	req, err := api.Client.NewRequest("GET", endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	// Response container for branch
	var branchRef github.Reference
	_, err = api.Client.Do(ctx, req, &branchRef)
	if err != nil {
		return nil, fmt.Errorf("error fetching branch: %v", err)
	}

	return &branchRef, nil
}

func (api *CommonAPI) CreateBranch(ctx context.Context, owner, repo, baseBranch, newBranchName string) (*github.Reference, error) {
	endpoint := fmt.Sprintf("/repos/%s/%s/git/refs", owner, repo)

	// Get the SHA of the base branch
	baseBranchRef, err := api.getBranchHead(context.Background(), owner, repo, baseBranch)
	if err != nil {
		return nil, errs.InternalServerError()
	}

	// Create a new POST request
	req, err := api.Client.NewRequest("POST", endpoint, map[string]string{
		"ref": fmt.Sprintf("refs/heads/%s", newBranchName),
		"sha": baseBranchRef.Object.GetSHA(),
	})
	if err != nil {
		return nil, errs.InternalServerError()
	}

	// Make the API call
	var branch github.Reference
	_, err = api.Client.Do(ctx, req, &branch)
	if err != nil {
		return nil, errs.InternalServerError()
	}

	return &branch, nil
}

func (api *CommonAPI) GetPullRequest(ctx context.Context, owner string, repo string, pullNumber int) (*github.PullRequest, error) {
	pr, _, err := api.Client.PullRequests.Get(ctx, owner, repo, pullNumber)

	return pr, err
}

func (api *CommonAPI) GetPullRequestDiff(ctx context.Context, owner string, repo string, pullNumber int) (string, error) {
	diff, _, err := api.Client.PullRequests.GetRaw(ctx, owner, repo, pullNumber, github.RawOptions{Type: github.Diff})
	if err != nil {
		return "", fmt.Errorf("error getting pull request diff: %v", err)
	}

	return diff, nil
}

func (api *CommonAPI) CreatePullRequest(ctx context.Context, owner string, repo string, baseBranch string, headBranch string, title string, body string) (*github.PullRequest, error) {
	newPR := &github.NewPullRequest{
		Title: github.String(title),      // Title of the PR
		Head:  github.String(headBranch), // Source branch
		Base:  github.String(baseBranch), // Target branch
		Body:  github.String(body),       // PR description
	}

	pr, _, err := api.Client.PullRequests.Create(ctx, owner, repo, newPR)
	if err != nil {
		return nil, fmt.Errorf("error creating pull request: %v", err)
	}
	return pr, nil
}

func (api *CommonAPI) CreatePRReview(ctx context.Context, owner string, repo string, body string, comments []models.PRReviewComment) (*github.PullRequestComment, error) {
	// hardcode PR number to 1 since we auto create the PR on fork
	endpoint := fmt.Sprintf("/repos/%s/%s/pulls/%d/reviews", owner, repo, 1)

	// Create a new POST request
	requestBody := map[string]interface{}{
		"event":    "COMMENT",
		"body":     body,
		"comments": comments,
	}

	req, err := api.Client.NewRequest("POST", endpoint, requestBody)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	// Response container
	var cmt github.PullRequestComment

	// Make the API call
	_, err = api.Client.Do(ctx, req, &cmt)
	if err != nil {
		return nil, fmt.Errorf("error creating PR comment: %v", err)
	}

	return &cmt, nil
}

func (api *CommonAPI) GetUserOrgs(ctx context.Context) ([]models.Organization, error) {
	// Construct the URL for the list assignments endpoint
	endpoint := "/user/orgs"

	// Create a new GET request
	req, err := api.Client.NewRequest("GET", endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	// Response container
	var orgs []models.Organization

	// Make the API call
	_, err = api.Client.Do(ctx, req, &orgs)
	if err != nil {
		return nil, fmt.Errorf("error fetching organizations: %v", err)
	}

	return orgs, nil
}

func (api *CommonAPI) GetUserOrgMembership(ctx context.Context, orgName string, userName string) (*github.Membership, error) {
	membership, _, err := api.Client.Organizations.GetOrgMembership(ctx, userName, orgName)
	return membership, err
}

func (api *CommonAPI) GetUser(ctx context.Context, userName string) (*github.User, error) {
	user, _, err := api.Client.Users.Get(ctx, userName)
	return user, err
}



func (api *CommonAPI) createRuleSet(ctx context.Context, ruleset interface{}, orgName, repoName string) error {
	endpoint := fmt.Sprintf("/repos/%s/%s/rulesets", orgName, repoName)
	req, err := api.Client.NewRequest("POST", endpoint, ruleset)
	if err != nil {
		return err
	}
	_, err = api.Client.Do(ctx, req, nil)
	return err
}

//Given a repo name and org name, create a push ruleset to protect the .github directory
func (api *CommonAPI) CreatePushRuleset(ctx context.Context, orgName, repoName string) error {
	body := map[string]interface{}{
		"name":        "Restrict .github Directory Edits: Preserves Submission Deadline",
		"target":      "push",
		"enforcement": "active",
		"rules": []interface{}{
			map[string]interface{}{
				"type": "file_path_restriction",
				"parameters": map[string]interface{}{
					"restricted_file_paths": []string{".github/**/*"},
				},
			},
		},
	}
	return api.createRuleSet(ctx, body, orgName, repoName)
}



func (api *CommonAPI) CreateBranchRuleset(ctx context.Context,  orgName, repoName string) error {
	body := map[string]interface{}{
		"name": "Feedback and Main Branch Protedtion: PR Enforcement",
		"target": "branch",
		"enforcement": "active",
		"conditions": map[string]interface{}{
			"ref_name": map[string]interface{}{
				"exclude": []interface{}{},
				"include": []interface{}{"refs/heads/feedback", "~DEFAULT_BRANCH"},
			},
		},
		"rules": []interface{}{
			map[string]interface{}{
				"type": "non_fast_forward",
			},
			map[string]interface{}{
				"type": "deletion",
			},
			map[string]interface{}{
				"type": "update",
				"parameters": map[string]interface{}{
				  "update_allows_fetch_and_merge": true,
				},
			  },
			  
			map[string]interface{}{
				"type": "pull_request",
				"parameters" : map[string]interface{}{
								"required_approving_review_count": 0,
        						"dismiss_stale_reviews_on_push": true,
       							"require_code_owner_review": false,
        						"require_last_push_approval": false,
        						"required_review_thread_resolution": false,
       							"automatic_copilot_code_review_enabled": false,
				},
			},
			map[string]interface{}{
				"type": "required_status_checks",
				"parameters": map[string]interface{}{
					"strict_required_status_checks_policy": false,
					"do_not_enforce_on_create": false,
					"required_status_checks": []map[string]string{
						map[string]string{
							"context": "check-date",
						},
						map[string]string{
							"context": "check-target",
						},

					},
					
				},
			},
		},
	}
	return api.createRuleSet(ctx, body, orgName, repoName)
}





func (api *CommonAPI) CreateDeadlineEnforcement(ctx context.Context, deadline *time.Time, orgName, repoName, branchName string) error {
	addition := models.RepositoryAddition{
		FilePath: ".github/workflows/deadline.yml",
		RepoName: repoName,
		OwnerName: orgName,
		DestinationBranch: branchName,
		Content: utils.ActionWithDeadline(deadline),
		CommitMessage: "Deadline enforcement GH action files",
	}
	return api.EditRepository(ctx, &addition)

}


func (api *CommonAPI) CreatePREnforcement(ctx context.Context, orgName, repoName, branchName string) error {

	addition := models.RepositoryAddition{
		FilePath: ".github/workflows/branchProtections.yml",
		RepoName: repoName,
		OwnerName: orgName,
		DestinationBranch: branchName,
		Content: utils.TargetBranchProtectionAction(),
		CommitMessage: "Deadline enforcement GH action files",
	}
	return api.EditRepository(ctx, &addition)

}

func (api *CommonAPI) EditRepository(ctx context.Context, addition *models.RepositoryAddition) error {
	endpoint := fmt.Sprintf("/repos/%s/%s/contents/%s", addition.OwnerName, addition.RepoName, addition.FilePath)
	encodedContent := base64.StdEncoding.EncodeToString([]byte(addition.Content))

	body := map[string]interface{}{
		"message": addition.CommitMessage,
		"content": encodedContent,
		"branch": addition.DestinationBranch,
	}
	req, err := api.Client.NewRequest("PUT", endpoint, body)
	if err != nil {
		return err
	}
	_, err = api.Client.Do(ctx, req, nil)
	return err
}



func (api *CommonAPI) InviteUserToOrganization(ctx context.Context, orgName string, userID int64) error {
	body := map[string]interface{}{
		"invitee_id": userID,
		"role":       "direct_member",
	}

	// Create a new request
	req, err := api.Client.NewRequest("POST", fmt.Sprintf("/orgs/%s/invitations", orgName), body)
	if err != nil {
		return fmt.Errorf("error creating request: %v", err)
	}

	// Make the API call
	_, err = api.Client.Do(ctx, req, nil)
	if err != nil {
		return fmt.Errorf("error inviting user to organization: %v", err)
	}

	return nil
}

func (api *CommonAPI) SetUserMembershipInOrg(ctx context.Context, orgName string, userName string, role string) error {
	body := map[string]interface{}{
		"role": role,
	}

	// Create a new request
	req, err := api.Client.NewRequest("PUT", fmt.Sprintf("/orgs/%s/memberships/%s", orgName, userName), body)
	if err != nil {
		return fmt.Errorf("error creating request: %v", err)
	}

	// Make the API call
	_, err = api.Client.Do(ctx, req, nil)
	if err != nil {
		return fmt.Errorf("error inviting user to organization: %v", err)
	}

	return nil

}

func (api *CommonAPI) CancelOrgInvitation(ctx context.Context, orgName string, userName string) error {
	endpoint := fmt.Sprintf("/orgs/%s/invitations/%s", orgName, userName)
	req, err := api.Client.NewRequest("DELETE", endpoint, nil)
	if err != nil {
		return fmt.Errorf("error creating request: %v", err)
	}

	_, err = api.Client.Do(ctx, req, nil)
	if err != nil {
		return fmt.Errorf("error canceling org invitation: %v", err)
	}

	return nil
}

func (api *CommonAPI) GetRepository(ctx context.Context, owner string, repoName string) (*github.Repository, error) {
	repo, _, err := api.Client.Repositories.Get(ctx, owner, repoName)
	return repo, err
}

func (api *CommonAPI) UpdateTeamRepoPermissions(ctx context.Context, org, teamSlug, owner, repo, permission string) error {
	endpoint := fmt.Sprintf("/orgs/%s/teams/%s/repos/%s/%s", org, teamSlug, owner, repo)

	// Create a new PUT request
	req, err := api.Client.NewRequest("PUT", endpoint, map[string]string{
		"permission": permission,
	})
	if err != nil {
		return errs.GithubAPIError(err)
	}

	// Make the API call
	_, err = api.Client.Do(ctx, req, nil)
	if err != nil {
		return errs.GithubAPIError(err)
	}

	return nil
}

func (api *CommonAPI) RemoveRepoFromTeam(ctx context.Context, org, teamSlug, owner, repo string) error {
	endpoint := fmt.Sprintf("/orgs/%s/teams/%s/repos/%s/%s", org, teamSlug, owner, repo)

	// Create a new DELETE request
	req, err := api.Client.NewRequest("DELETE", endpoint, nil)
	if err != nil {
		return errs.GithubAPIError(err)
	}

	// Make the API call
	_, err = api.Client.Do(ctx, req, nil)
	if err != nil {
		return errs.GithubAPIError(err)
	}

	return nil
}

func (api *CommonAPI) GetTeam(ctx context.Context, teamID int64) (*github.Team, error) {
	team, _, err := api.Client.Teams.GetTeam(ctx, teamID)
	return team, err
}

func (api *CommonAPI) CreateTeam(ctx context.Context, orgName, teamName string, description *string, maintainers []string) (*github.Team, error) {
	team := &github.NewTeam{
		Name:        teamName,
		Description: description,
		Maintainers: maintainers,
	}

	createdTeam, _, err := api.Client.Teams.CreateTeam(ctx, orgName, *team)
	if err != nil {
		return nil, fmt.Errorf("error creating team: %v", err)
	}

	return createdTeam, nil
}

func (api *CommonAPI) DeleteTeam(ctx context.Context, teamID int64) error {
	_, err := api.Client.Teams.DeleteTeam(ctx, teamID)
	if err != nil {
		return fmt.Errorf("error deleting team: %v", err)
	}
	return nil
}

func (api *CommonAPI) GetTeamByName(ctx context.Context, orgName string, teamName string) (*github.Team, error) {
	endpoint := fmt.Sprintf("/orgs/%s/teams/%s", orgName, teamName)
	req, err := api.Client.NewRequest("GET", endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	var team github.Team
	_, err = api.Client.Do(ctx, req, &team)
	if err != nil {
		return nil, fmt.Errorf("error fetching team: %v", err)
	}

	return &team, nil
}

// Adds a user to a team (this also will invite the user to the organization if they are not already a member)
func (api *CommonAPI) AddTeamMember(ctx context.Context, teamID int64, userName string, opt *github.TeamAddTeamMembershipOptions) error {
	_, _, err := api.Client.Teams.AddTeamMembership(ctx, teamID, userName, opt)
	if err != nil {
		return fmt.Errorf("error adding member to team: %v", err)
	}

	return nil
}

func (api *CommonAPI) RemoveTeamMember(ctx context.Context, orgName string, teamID int64, userName string) error {
	_, err := api.Client.Teams.RemoveTeamMembership(ctx, teamID, userName)
	return err
}

func (api *CommonAPI) GetTeamMembers(ctx context.Context, teamID int64) ([]*github.User, error) {
	members, _, err := api.Client.Teams.ListTeamMembers(ctx, teamID, nil)
	return members, err
}

func (api *CommonAPI) CreateEmptyCommit(ctx context.Context, owner, repo string) error {
	ghRepo, err := api.GetRepository(ctx, owner, repo)
	if err != nil {
		return err
	}
	if ghRepo.DefaultBranch == nil {
		return errs.MissingDefaultBranchError()
	}

	// Get the reference to main branch
	ref, _, err := api.Client.Git.GetRef(context.Background(), owner, repo, "heads/"+*ghRepo.DefaultBranch)
	if err != nil {
		return err
	}

	// if no parent commit exists, refer to the empty tree
	tree := "4b825dc642cb6eb9a060e54bf8d69288fbee4904"
	var parentCommitSHA string
	if ref.Object != nil {
		// Get the commit from the ref
		parentCommitSHA = ref.Object.GetSHA()
		if parentCommitSHA != "" {
			parentCommit, _, err := api.Client.Git.GetCommit(context.Background(), owner, repo, parentCommitSHA)
			if err != nil {
				return err
			}

			tree = parentCommit.Tree.GetSHA()
		}
	}

	// create commit from parent commit tree (no changes)
	endpoint := fmt.Sprintf("/repos/%s/%s/git/commits", owner, repo)
	body := map[string]interface{}{
		"message": "Setting up GitMarks feedback",
		"tree":    tree,
	}
	if parentCommitSHA != "" {
		body["parents"] = [1]string{parentCommitSHA}
	}
	req, err := api.Client.NewRequest("POST", endpoint, body)
	if err != nil {
		return errs.GithubAPIError(err)
	}
	var commit github.Commit
	_, err = api.Client.Do(ctx, req, &commit)
	if err != nil {
		return errs.GithubAPIError(err)
	}

	// update main to point to the new empty commit
	endpoint = fmt.Sprintf("/repos/%s/%s/git/refs/heads/%s", owner, repo, *ghRepo.DefaultBranch)
	req, err = api.Client.NewRequest("PATCH", endpoint, map[string]interface{}{
		"sha":   commit.SHA,
		"force": true,
	})
	if err != nil {
		return errs.GithubAPIError(err)
	}
	_, err = api.Client.Do(ctx, req, nil)
	if err != nil {
		return errs.GithubAPIError(err)
	}

	return nil
}

func (api *CommonAPI) CheckForkIsReady(ctx context.Context, repo *github.Repository) bool {
	if repo == nil || repo.Parent.FullName == nil {
		return false
	}

	// Get all branches from source repo
	endpoint := fmt.Sprintf("/repos/%s/branches", *repo.Parent.FullName)
	req, err := api.Client.NewRequest("GET", endpoint, nil)
	if err != nil {
		return false
	}

	var srcBranches []github.Branch
	_, err = api.Client.Do(ctx, req, &srcBranches)
	if err != nil {
		return false
	}

	// Get all branches from forked repo
	endpoint = fmt.Sprintf("/repos/%s/branches", *repo.FullName)
	req, err = api.Client.NewRequest("GET", endpoint, nil)
	if err != nil {
		return false
	}

	var branches []github.Branch
	_, err = api.Client.Do(ctx, req, &branches)
	if err != nil {
		return false
	}

	return len(branches) == len(srcBranches)
}
