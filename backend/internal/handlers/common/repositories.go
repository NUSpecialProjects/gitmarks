package common

import (
	"context"

	"github.com/CamPlume1/khoury-classroom/internal/errs"
	"github.com/CamPlume1/khoury-classroom/internal/github"
	"github.com/CamPlume1/khoury-classroom/internal/storage"
	"github.com/CamPlume1/khoury-classroom/internal/utils"
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
	baseRepo, err := store.GetBaseRepoByID(ctx, *repository.ID)
	if err != nil {
		return errs.InternalServerError()
	}

	// Retrieve assignment deadline from DB
	template, err := store.GetAssignmentByRepoName(ctx, *repository.Name)
	if err != nil {
		//@KHO-239
		return err
	}

	if template.MainDueDate != nil {
		// There is a deadline
		err = appClient.CreateDeadlineEnforcement(ctx, template.MainDueDate, *repository.Organization, *repository.Name, MainRepoBranch)
		if err != nil {
			//@KHO-239
			return err
		}
	}

	// Create PR Enforcement Action
	err = appClient.CreatePREnforcement(ctx, *repository.Organization, *repository.Name, MainRepoBranch)
	if err != nil {
		return err
	}

	// Is the base repo initialized according to the database?
	branchesExist := baseRepo.Initialized
	if !branchesExist {
		// If not, check if the branches exist on GitHub
		branchesExist, err = checkBranchesExist(ctx, appClient, *repository.Organization, *repository.Name)
		if err != nil {
			return errs.InternalServerError()
		}
	}
	// If the branches do not exist, create them
	if !branchesExist {
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
		err = appClient.CreateEmptyCommit(ctx, *repository.Owner.Name, *repository.Name)
		if err != nil {
			return errs.InternalServerError()
		}
	}

	// Update the base repo initialized field in the database
	err = store.UpdateBaseRepoInitialized(ctx, *repository.ID, true)
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

func checkBranchesExist(ctx context.Context, client github.GitHubBaseClient, repoOwner string, repoName string) (bool, error) {
	branches, err := client.GetBranches(ctx, repoOwner, repoName)
	if err != nil {
		return false, err
	}

	branchNames := utils.Map(branches, func(b *gh.Branch) string { return *b.Name })

	for _, branch := range OtherRepoBranches {
		if !utils.Contains(branchNames, branch) {
			return false, nil
		}
	}

	return true, nil
}
