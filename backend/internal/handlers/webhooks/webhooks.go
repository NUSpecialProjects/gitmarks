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
		return c.SendStatus(400)
	}

	return handler(c)
}

func (s *WebHookService) PR(c *fiber.Ctx) error {
	println("PR webhook event")
	return c.SendStatus(200)
}

func (s *WebHookService) PRComment(c *fiber.Ctx) error {
	payload := models.PRComment{}
	if err := c.BodyParser(&payload); err != nil {
		return err
	}
	if payload.Comment.AuthorAssociation == "COLLABORATOR" {
		println("regrade request")
	}
	return c.SendStatus(200)
}

func (s *WebHookService) PRThread(c *fiber.Ctx) error {
	println("PR thread webhook event")
	return c.SendStatus(200)
}

func (s *WebHookService) PushEvent(c *fiber.Ctx) error {
	// Extract the 'payload' form value
	pushEvent := github.PushEvent{}
	if err := c.BodyParser(&pushEvent); err != nil {
		return err
	}

	// Check if this is first commit in a repository
	isInitialCommit, err := s.isInitialCommit(pushEvent)
	if err != nil {
		return err
	}

	// If app bot triggered the initial commit, initialize the base repository
	if isInitialCommit && isBotPushEvent(pushEvent) {
		err = s.baseRepoInitialization(c, pushEvent)
		if err != nil {
			return err
		}
	}

	// If students pushed commits, update the work state accordingly
	if !isBotPushEvent(pushEvent) && pushEvent.Commits != nil && len(pushEvent.Commits) > 0 {
		err = s.updateWorkStateOnStudentCommit(c, pushEvent)
		if err != nil {
			return err
		}
	}

	return nil
}

func isBotPushEvent(pushEvent github.PushEvent) bool {
	return pushEvent.Pusher != nil &&
		pushEvent.Pusher.Name != nil &&
		strings.Contains(*pushEvent.Pusher.Name, "[bot]")
}

func (s *WebHookService) baseRepoInitialization(c *fiber.Ctx, pushEvent github.PushEvent) error {
	if pushEvent.Repo == nil || pushEvent.Repo.Organization == nil || pushEvent.Repo.Name == nil || pushEvent.Repo.MasterBranch == nil {
		return errs.BadRequest(errors.New("invalid repository data"))
	}

	// Retrieve assignment deadline from DB
	deadline, err := s.store.GetAssignmentDueDateByRepoName(c.Context(), *pushEvent.Repo.Name)
	if err != nil && deadline == nil {
		// There is a deadline
		err = s.appClient.CreateDeadlineEnforcement(c.Context(), deadline, *pushEvent.Repo.Organization, *pushEvent.Repo.Name)
		if err != nil {
			//TODO: Recovery. Will do in a new ticket. For now, log. KHO-239
			return err
		}
	}
	//Create PR Enforcement Action
	// Should store org info with default branch, and encode the name here, could be master
	err = s.appClient.CreatePREnforcement(c.Context(), *pushEvent.Repo.Organization, *pushEvent.Repo.Name, "main")
		if err != nil {
			return err
		}

	//Create necessary repo branches
	repoBranches := []string{"development", "feedback"}
	for _, branch := range repoBranches {
		_, err = s.appClient.CreateBranch(c.Context(),
			*pushEvent.Repo.Organization,
			*pushEvent.Repo.Name,
			*pushEvent.Repo.MasterBranch,
			branch)

		if err != nil {
			return errs.InternalServerError()
		}
	}


	err = s.appClient.CreatePushRuleset(c.Context(),  *pushEvent.Repo.Organization, *pushEvent.Repo.Name)
	if err != nil {
		// TODO: Recovery. Will do in a new ticket. For now, log
		return err
	}

	// Find the associated assignment and classroom
	assignmentOutline, err := s.store.GetAssignmentByBaseRepoID(c.Context(), *pushEvent.Repo.ID)
	if err != nil {
			// TODO: Recovery. Will do in a new ticket. For now, log
			return err
	}
	classroom, err := s.store.GetClassroomByID(c.Context(), assignmentOutline.ClassroomID)
	if err != nil {
			// TODO: Recovery. Will do in a new ticket. For now, log
			return err
	}

	// Give the student team read access to the repository
	err = s.appClient.UpdateTeamRepoPermissions(c.Context(), *pushEvent.Repo.Organization, *classroom.StudentTeamName,
		*pushEvent.Repo.Organization, *pushEvent.Repo.Name, "pull")
	if err != nil {
			// TODO: Recovery. Will do in a new ticket. For now, log
			return err
	}

	return c.SendStatus(200)
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
		studentWork.FirstCommitDate = &pushEvent.Commits[0].Timestamp.Time
	}

	if pushEvent.Ref != nil {
		// TODO: Dynamically determine branch names once parameterized
		// If commiting to main branch, mark as submitted
		if *pushEvent.Ref == "refs/heads/main" {
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

	return c.SendStatus(200)
}

func (s *WebHookService) isInitialCommit(pushEvent github.PushEvent) (bool, error) {
	isInitialCommit := pushEvent.BaseRef == nil && *pushEvent.Created && pushEvent.GetBefore() == "0000000000000000000000000000000000000000"
	return isInitialCommit, nil
}
