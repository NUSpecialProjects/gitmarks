package webhooks

import (
	"errors"
	"strings"

	"github.com/CamPlume1/khoury-classroom/internal/errs"
	models "github.com/CamPlume1/khoury-classroom/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/go-github/github"
)

func (s *WebHookService) WebhookHandler(c *fiber.Ctx) error {
	var dispatch = map[string]func(c *fiber.Ctx) error{
		"pull_request":                s.PR,
		"pull_request_review_comment": s.PRComment,
		"pull_request_review_thread":  s.PRThread,
		"push":                        s.PushEvent,
	}
	event := c.Get("X-GitHub-Event", "")

	handler, exists := dispatch[event]
	if !exists {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return handler(c)
}

func (s *WebHookService) PR(c *fiber.Ctx) error {
	println("PR webhook event")
	return c.SendStatus(fiber.StatusOK)
}

// todo: finish regrade request handling
func (s *WebHookService) PRComment(c *fiber.Ctx) error {
	payload := models.WebHookPRComment{}
	if err := c.BodyParser(&payload); err != nil {
		return err
	}
	if payload.Comment.AuthorAssociation == "COLLABORATOR" {
		println("regrade request")
	}
	return c.SendStatus(fiber.StatusOK)
}

func (s *WebHookService) PRThread(c *fiber.Ctx) error {
	println("PR thread webhook event")
	return c.SendStatus(fiber.StatusOK)
}

func (s *WebHookService) PushEvent(c *fiber.Ctx) error {
	// Unmarshal the JSON payload into the PushEvent struct
	pushEvent := github.PushEvent{}
	if err := c.BodyParser(&pushEvent); err != nil {
		return err
	}

	// If app bot triggered the initial commit, initialize the base repository
	if isInitialCommit(pushEvent) && isBotPushEvent(pushEvent) {
		err := s.baseRepoInitialization(c, pushEvent)
		if err != nil {
			return err
		}
	}

	// If students pushed commits, update the work state accordingly
	if !isBotPushEvent(pushEvent) && pushEvent.Commits != nil && len(pushEvent.Commits) > 0 {
		err := s.updateWorkStateOnStudentCommit(c, pushEvent)
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *WebHookService) baseRepoInitialization(c *fiber.Ctx, pushEvent github.PushEvent) error {
	if pushEvent.Repo == nil || pushEvent.Repo.Organization == nil || pushEvent.Repo.Name == nil || pushEvent.Repo.MasterBranch == nil {
		return errs.BadRequest(errors.New("invalid repository data"))
	}

	// Create necessary repo branches
	repoBranches := []string{"development", "feedback"}
	for _, branch := range repoBranches {
		_, err := s.appClient.CreateBranch(c.Context(),
			*pushEvent.Repo.Organization,
			*pushEvent.Repo.Name,
			*pushEvent.Repo.MasterBranch,
			branch)

		if err != nil {
			return errs.InternalServerError()
		}
	}

	// Create empty commit (will create a diff that allows feedback PR to be created)
	err := s.appClient.CreateEmptyCommit(c.Context(), *pushEvent.Repo.Organization, *pushEvent.Repo.Name)
	if err != nil {
		return errs.InternalServerError()
	}

	// Find the associated assignment and classroom
	assignmentOutline, err := s.store.GetAssignmentByBaseRepoID(c.Context(), *pushEvent.Repo.ID)
	if err != nil {
		return errs.InternalServerError()
	}
	classroom, err := s.store.GetClassroomByID(c.Context(), assignmentOutline.ClassroomID)
	if err != nil {
		return errs.InternalServerError()
	}

	// Give the student team read access to the repository
	err = s.appClient.UpdateTeamRepoPermissions(c.Context(), *pushEvent.Repo.Organization, *classroom.StudentTeamName,
		*pushEvent.Repo.Organization, *pushEvent.Repo.Name, "pull")
	if err != nil {
		return errs.InternalServerError()
	}

	return c.SendStatus(fiber.StatusOK)
}

func (s *WebHookService) updateWorkStateOnStudentCommit(c *fiber.Ctx, pushEvent github.PushEvent) error {
	// Find the associated student work
	studentWork, err := s.store.GetWorkByRepoName(c.Context(), *pushEvent.Repo.Name)
	if err != nil {
		return err
	}

	// Mark the project as started if this is our first student commit
	if studentWork.WorkState == models.WorkStateAccepted {
		studentWork.WorkState = models.WorkStateStarted
		firstCommitDate := pushEvent.Commits[0].Timestamp.Time.UTC()
		studentWork.FirstCommitDate = &firstCommitDate
	}

	if pushEvent.Ref != nil {
		// Update the last commit date
		if len(pushEvent.Commits) > 0 {
			lastCommitDate := pushEvent.Commits[0].Timestamp.Time.UTC()
			studentWork.LastCommitDate = &lastCommitDate
		}

		// TODO: Dynamically determine branch names once parameterized
		// If commiting to main branch, mark as submitted
		if *pushEvent.Ref == "refs/heads/"+*pushEvent.Repo.DefaultBranch {
			studentWork.WorkState = models.WorkStateSubmitted
		} else if *pushEvent.Ref != "refs/heads/feedback" {
			// If not committing to main/ or feedback/ branch, increment commit amount
			studentWork.CommitAmount += len(pushEvent.Commits)
		}
	}

	// Store updated student work locally
	_, err = s.store.UpdateStudentWork(c.Context(), studentWork)
	if err != nil {
		return errs.InternalServerError()
	}

	return c.SendStatus(fiber.StatusOK)
}

func isInitialCommit(pushEvent github.PushEvent) bool {
	return pushEvent.BaseRef == nil && *pushEvent.Created && pushEvent.GetBefore() == "0000000000000000000000000000000000000000"
}

func isBotPushEvent(pushEvent github.PushEvent) bool {
	return pushEvent.Pusher != nil &&
		pushEvent.Pusher.Name != nil &&
		strings.Contains(*pushEvent.Pusher.Name, "[bot]")
}
