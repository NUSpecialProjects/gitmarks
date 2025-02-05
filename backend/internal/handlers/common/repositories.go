package common

import (
	"context"

	"github.com/CamPlume1/khoury-classroom/internal/errs"
	"github.com/CamPlume1/khoury-classroom/internal/github"
	"github.com/CamPlume1/khoury-classroom/internal/storage"
	gh "github.com/google/go-github/github"
)

var (
	MainRepoBranch    = "main"
	OtherRepoBranches = []string{"development", "feedback"}
)

func InitializeRepo(ctx context.Context, appClient github.GitHubAppClient, store storage.Storage, repoID int64, repoOwner string, repoName string) error {
	repo := gh.PushEventRepository{
		ID:           &repoID,
		Organization: &repoOwner,
		Name:         &repoName,
		Owner: &gh.PushEventRepoOwner{
			Name: &repoOwner,
		},
	}

	return InitializePushEventRepo(ctx, appClient, store, &repo)
}

func InitializePushEventRepo(ctx context.Context, appClient github.GitHubAppClient, store storage.Storage, repository *gh.PushEventRepository) error {
	// Get the master branch name (use main if not specified)
	mainBranch := MainRepoBranch
	if repository.MasterBranch != nil {
		mainBranch = *repository.MasterBranch
	}

	// Create necessary repo branches
	for _, branch := range OtherRepoBranches {
		_, err := appClient.CreateBranch(ctx,
			*repository.Organization,
			*repository.Name,
			mainBranch,
			branch)
		if err != nil {
			return errs.InternalServerError()
		}
	}

	// Create empty commit (will create a diff that allows feedback PR to be created)
	err := appClient.CreateEmptyCommit(ctx, *repository.Owner.Name, *repository.Name)
	if err != nil {
		return errs.InternalServerError()
	}

	// Find the associated assignment and classroom
	assignmentOutline, err := store.GetAssignmentByBaseRepoID(ctx, *repository.ID)
	if err != nil {
		return errs.InternalServerError()
	}

	classroom, err := store.GetClassroomByID(ctx, assignmentOutline.ClassroomID)
	if err != nil {
		return errs.InternalServerError()
	}

	// Give the student team read access to the repository
	err = appClient.UpdateTeamRepoPermissions(ctx, *repository.Owner.Name, *classroom.StudentTeamName,
		*repository.Owner.Name, *repository.Name, "pull")
	if err != nil {
		return errs.InternalServerError()
	}

	err = store.UpdateBaseRepoInitialized(ctx, *repository.ID, true)
	if err != nil {
		return errs.InternalServerError()
	}

	return nil
}

// Checks if a repository is initialized by checking if the initialized field in the database is true.
func CheckBaseRepoInitialized(ctx context.Context, store storage.Storage, repoID int64) (bool, error) {
	baseRepo, err := store.GetBaseRepoByID(ctx, repoID)
	if err != nil {
		return false, errs.InternalServerError()
	}

	return baseRepo.Initialized, nil
}
