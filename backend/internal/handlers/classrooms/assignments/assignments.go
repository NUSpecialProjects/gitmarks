package assignments

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/CamPlume1/khoury-classroom/internal/errs"
	"github.com/CamPlume1/khoury-classroom/internal/github"
	"github.com/CamPlume1/khoury-classroom/internal/handlers/common"
	"github.com/CamPlume1/khoury-classroom/internal/middleware"
	"github.com/CamPlume1/khoury-classroom/internal/models"
	"github.com/CamPlume1/khoury-classroom/internal/utils"
	"github.com/gofiber/fiber/v2"
	gh "github.com/google/go-github/github"
	"github.com/jackc/pgx/v5"
)

// Returns the assignments in a classroom.
func (s *AssignmentService) getAssignments() fiber.Handler {
	return func(c *fiber.Ctx) error {
		classroomID, err := strconv.ParseInt(c.Params("classroom_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		assignments, err := s.store.GetAssignmentsInClassroom(c.Context(), classroomID)
		if err != nil {
			return errs.InternalServerError()
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{
			"assignment_outlines": assignments,
		})
	}
}

// Returns the details of an assignment.
func (s *AssignmentService) getAssignment() fiber.Handler {
	return func(c *fiber.Ctx) error {
		assignmentID, err := strconv.ParseInt(c.Params("assignment_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		assignment, err := s.store.GetAssignmentByID(c.Context(), assignmentID)
		if err != nil {
			return errs.InternalServerError()
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{
			"assignment_outline": assignment,
		})
	}
}

// Returns the template of an assignment.
func (s *AssignmentService) getAssignmentTemplate() fiber.Handler {
	return func(c *fiber.Ctx) error {
		assignmentID, err := strconv.ParseInt(c.Params("assignment_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		assignmentTemplate, err := s.store.GetAssignmentTemplateByAssignmentID(c.Context(), assignmentID)
		if err != nil {
			return errs.InternalServerError()
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{"assignment_template": assignmentTemplate})
	}
}

func (s *AssignmentService) createAssignment() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Parse request body
		var assignmentData models.AssignmentOutline
		error := c.BodyParser(&assignmentData)
		if error != nil {
			return errs.InvalidRequestBody(assignmentData)
		}

		// Check if user has at least Professor role
		_, err := s.RequireAtLeastRole(c, assignmentData.ClassroomID, models.Professor)
		if err != nil {
			return err
		}

		// Error if assignment already exists
		existingAssignment, err := s.store.GetAssignmentByNameAndClassroomID(c.Context(), assignmentData.Name, assignmentData.ClassroomID)
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return err
		}
		if existingAssignment != nil {
			return errs.BadRequest(errors.New("assignment with that name already exists"))
		}

		// Get classroom and assignment template
		classroom, err := s.store.GetClassroomByID(c.Context(), assignmentData.ClassroomID)
		if err != nil {
			return err
		}
		template, err := s.store.GetAssignmentTemplateByID(c.Context(), assignmentData.TemplateID)
		if err != nil {
			return err
		}

		// Create base repository and store locally
		baseRepoName, err := generateUniqueRepoName(c.Context(), s.appClient, classroom.OrgName, classroom.Name, assignmentData.Name)
		if err != nil {
			return err
		}

		baseRepo, err := s.appClient.CreateRepoFromTemplate(c.Context(), classroom.OrgName, template.TemplateRepoName, baseRepoName)
		if err != nil {
			return err
		}
		err = s.store.CreateBaseRepo(c.Context(), *baseRepo)
		if err != nil {
			return err
		}

		// Store assignment locally
		assignmentData.BaseRepoID = baseRepo.BaseID
		createdAssignment, err := s.store.CreateAssignment(c.Context(), assignmentData)
		if err != nil {
			return err
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{
			"created_assignment": createdAssignment,
		})
	}
}

// Generates a token to accept an assignment.
func (s *AssignmentService) generateAssignmentToken() fiber.Handler {
	return func(c *fiber.Ctx) error {
		body := models.AssignmentTokenRequestBody{}

		if err := c.BodyParser(&body); err != nil {
			return errs.InvalidRequestBody(body)
		}

		assignmentID, err := strconv.ParseInt(c.Params("assignment_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		// if the link is permenant, use the existing permanent token
		if body.Duration == nil {
			assignmentToken, err := s.store.GetPermanentAssignmentTokenByAssignmentID(c.Context(), assignmentID)
			if err == nil {
				return c.Status(http.StatusOK).JSON(fiber.Map{"token": assignmentToken.Token})
			}
		}

		token, err := utils.GenerateToken(16)
		if err != nil {
			return errs.InternalServerError()
		}

		tokenData := models.AssignmentToken{
			AssignmentID: assignmentID,
			BaseToken: models.BaseToken{
				Token: token,
			},
		}

		// Set ExpiresAt only if Duration is provided
		if body.Duration != nil {
			expiresAt := time.Now().Add(time.Duration(*body.Duration) * time.Minute)
			tokenData.ExpiresAt = &expiresAt
		}

		assignmentToken, err := s.store.CreateAssignmentToken(c.Context(), tokenData)
		if err != nil {
			return errs.InternalServerError()
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{"token": assignmentToken.Token})
	}
}

// Uses an assignment token to accept an assignment.
func (s *AssignmentService) useAssignmentToken() fiber.Handler {
	//@KHO-239
	return func(c *fiber.Ctx) error {
		token := c.Params("token")
		if token == "" {
			return errs.BadRequest(errors.New("token is required"))
		}

		// Get client and user
		client, githubUser, user, err := middleware.GetClientAndUser(c, s.store, s.userCfg)
		if err != nil {
			return errs.AuthenticationError()
		}

		// Get assignment using the token
		assignment, err := s.store.GetAssignmentByToken(c.Context(), token)
		if err != nil {
			return errs.BadRequest(errors.New("invalid token"))
		}

		// Get assignment base repository
		baseRepo, err := s.store.GetBaseRepoByID(c.Context(), assignment.BaseRepoID)
		if err != nil {
			return errs.InternalServerError()
		}

		// Initialize the base repository if it is not initialized already
		err = common.InitializeRepo(c.Context(), s.appClient, s.store, baseRepo.BaseID, baseRepo.BaseRepoOwner, baseRepo.BaseRepoName)
		if err != nil {
			return errs.InternalServerError()
		}

		// Get classroom
		classroom, err := s.store.GetClassroomByID(c.Context(), assignment.ClassroomID)
		if err != nil {
			return errs.InternalServerError()
		}

		// Check if user has at least student role
		_, err = s.RequireAtLeastRole(c, classroom.ID, models.Student)
		if err != nil {
			// Add them to the classroom as a student
			_, _, _, err = common.InviteUserToClassroom(c.Context(), s.store, s.appClient, client, classroom.ID, models.Student, &user)
			if err != nil {
				return errs.InternalServerError()
			}

			// Ensure they have student role now and have successfully joined the classroom
			_, err = s.RequireAtLeastRole(c, classroom.ID, models.Student)
			if err != nil {
				return err
			}
		}

		// Check if the user has already accepted the assignment (student work exists already)
		studentWork, err := s.store.GetWorkByGitHubUserID(c.Context(), int(classroom.ID), int(assignment.ID), githubUser.ID)
		if err == nil { // student work exists
			// We can assume the student has access to see this repository since it is their own work
			studentWorkRepo, err := client.GetRepository(c.Context(), classroom.OrgName, studentWork.RepoName)
			if err != nil {
				return errs.GithubAPIError(err)
			}

			if studentWork.WorkState != models.WorkStateNotAccepted { // This is a bit redundant, but it's good to be explicit
				return c.Status(http.StatusOK).JSON(fiber.Map{
					"message":  "Assignment already accepted",
					"repo_url": studentWorkRepo.HTMLURL,
				})
			}
		}

		// Generate fork name, appending a numeric suffix if necessary
		forkName, err := generateUniqueRepoName(c.Context(), client, classroom.OrgName, baseRepo.BaseRepoName, githubUser.Login)
		if err != nil {
			return err
		}

		// Generate fork
		err = client.ForkRepository(c.Context(),
			baseRepo.BaseRepoOwner,
			baseRepo.BaseRepoName,
			classroom.OrgName,
			forkName)
		if err != nil {
			return errs.GithubAPIError(err)
		}

		// TODO HERE: insert repo name to fork_queue table, quit
		// listen for webhook repository creation: if repo name in fork_queue table, create PR and remove read rights etc

		// Wait to perform actions on the fork until it is finished initializing
		initialDelay := 1 * time.Second
		maxDelay := 30 * time.Second

		var studentWorkRepo *gh.Repository
		for {
			repo, err := client.GetRepository(c.Context(), classroom.OrgName, forkName)
			if err != nil {
				if initialDelay > maxDelay {
					return errs.GithubAPIError(errors.New("fork unsuccessful, please try again later"))
				}
				time.Sleep(initialDelay)
				initialDelay *= 2
				continue
			}

			studentWorkRepo = repo
			if client.CheckForkIsReady(c.Context(), studentWorkRepo) {
				break
			}

			if initialDelay > maxDelay {
				return errs.GithubAPIError(errors.New("fork unsuccessful, please try again later"))
			}

			time.Sleep(initialDelay)
			initialDelay *= 2
		}

		// Create feedback pull request
		err = client.CreateFeedbackPR(c.Context(), studentWorkRepo.GetOrganization().GetLogin(), studentWorkRepo.GetName())
		if err != nil {
			return errs.CriticalGithubError()
		}

		// KHO-239
		err = client.CreateBranchRuleset(c.Context(), classroom.OrgName, forkName)
		if err != nil {
			return errs.CriticalGithubError()
		}

		// Remove student team's access to forked repo
		err = client.RemoveRepoFromTeam(c.Context(), classroom.OrgName, *classroom.StudentTeamName, classroom.OrgName, studentWorkRepo.GetName())
		if err != nil {
			return errs.GithubAPIError(err)
		}

		// Insert into DB
		_, err = s.store.CreateStudentWork(c.Context(), assignment.ID, githubUser.ID, forkName, models.WorkStateAccepted, assignment.MainDueDate)
		if err != nil {
			return err
		}

		// TODO Here: Enable Github Actions on student repo.

		return c.Status(http.StatusOK).JSON(fiber.Map{
			"message":  "Assignment Accepted!",
			"repo_url": studentWorkRepo.GetHTMLURL(),
		})
	}
}

// Checks if an assignment with a given name exists in a classroom.
func (s *AssignmentService) checkAssignmentName() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Fetch assignment name and classrooID from request
		assignmentName := c.Params("assignment_name")
		if assignmentName == "" {
			return errs.BadRequest(errors.New("assignment name is required"))
		}
		classroomID, err := strconv.ParseInt(c.Params("classroom_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		// Check if assignment with name exists
		assignment, err := s.store.GetAssignmentByNameAndClassroomID(c.Context(), assignmentName, classroomID)
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return err
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{
			"exists": assignment != nil,
		})
	}
}

// Generates a unique repository name by appending a numeric suffix if necessary.
func generateUniqueRepoName(ctx context.Context, client github.GitHubBaseClient, orgName string, parts ...string) (string, error) {
	// Check if fork name already exists
	suffixStr := ""
	maxAttempts := 10
	for i := 0; i < maxAttempts; i++ {
		allParts := append(parts, suffixStr)
		forkName := generateSlugCase(allParts...)
		studentWorkRepo, _ := client.GetRepository(ctx, orgName, forkName) // don't check error because we are checking if repo exists
		if studentWorkRepo == nil {
			return forkName, nil
		}
		suffixStr = strconv.Itoa(i + 1)
	}
	return "", errs.GithubAPIError(errors.New("failed to generate unique fork name"))
}

func generateSlugCase(parts ...string) string {
	var processedParts []string
	for _, part := range parts {
		// Replace spaces with hyphens and keep only alphanumeric characters
		processed := strings.Map(func(r rune) rune {
			switch {
			case r >= 'a' && r <= 'z':
				return r
			case r >= 'A' && r <= 'Z':
				return r
			case r >= '0' && r <= '9':
				return r
			case r == ' ' || r == '-':
				return '-'
			default:
				return -1
			}
		}, part)

		// Remove consecutive hyphens
		for strings.Contains(processed, "--") {
			processed = strings.ReplaceAll(processed, "--", "-")
		}

		// Trim hyphens from start and end
		processed = strings.Trim(processed, "-")

		if processed != "" {
			processedParts = append(processedParts, processed)
		}
	}

	result := strings.Join(processedParts, "-")

	return result
}

// Updates an existing assignment.
func (s *AssignmentService) updateAssignmentRubric() fiber.Handler {
	return func(c *fiber.Ctx) error {
		assignmentID, err := strconv.ParseInt(c.Params("assignment_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		var rubricID int64
		error := c.BodyParser(&rubricID)
		if error != nil {
			return errs.BadRequest(error)
		}

		updatedAssignment, err := s.store.UpdateAssignmentRubric(c.Context(), rubricID, assignmentID)
		if err != nil {
			return errs.InternalServerError()
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{"assignment_outline": updatedAssignment})
	}
}

func (s *AssignmentService) getAssignmentRubric() fiber.Handler {
	return func(c *fiber.Ctx) error {
		assignmentID, err := strconv.ParseInt(c.Params("assignment_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		assignment, err := s.store.GetAssignmentByID(c.Context(), assignmentID)
		if err != nil {
			return errs.InternalServerError()
		}

		if assignment.RubricID == nil {
			return c.Status(http.StatusOK).JSON(nil)
		}

		rubric, err := s.store.GetRubric(c.Context(), *assignment.RubricID)
		if err != nil {
			return errs.InternalServerError()
		}

		rubricItems, err := s.store.GetRubricItems(c.Context(), rubric.ID)
		if err != nil {
			return errs.InternalServerError()
		}

		return c.Status(http.StatusOK).JSON(models.FullRubric{
			Rubric:      rubric,
			RubricItems: rubricItems,
		})
	}
}

func (s *AssignmentService) getGradedCount() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Parse assignmentID
		assignmentID, err := strconv.ParseInt(c.Params("assignment_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		// Query work status counts
		counts, err := s.store.CountWorksByState(c.Context(), int(assignmentID))
		if err != nil {
			return errs.InternalServerError()
		}

		// Count graded/ungraded works
		gradedWorks := 0
		ungradedWorks := 0
		for state, count := range counts {
			if state == models.WorkStateGradingCompleted || state == models.WorkStateGradePublished {
				gradedWorks += count
			} else {
				ungradedWorks += count
			}
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{
			"assignment_id": assignmentID,
			"status": fiber.Map{
				"graded":   gradedWorks,
				"ungraded": ungradedWorks,
			},
		})
	}
}

func (s *AssignmentService) getAssignmentStatus() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Parse assignmentID and classroomID
		assignmentID, err := strconv.ParseInt(c.Params("assignment_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}
		classroomID, err := strconv.ParseInt(c.Params("classroom_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		// Query work status counts
		counts, err := s.store.CountWorksByState(c.Context(), int(assignmentID))
		if err != nil {
			return errs.InternalServerError()
		}

		// Count assignment statuses
		acceptedWork := counts[models.WorkStateAccepted]
		startedWork := counts[models.WorkStateStarted]
		submittedWork := counts[models.WorkStateSubmitted]
		workInGrading := counts[models.WorkStateGradingAssigned] +
			counts[models.WorkStateGradingCompleted] +
			counts[models.WorkStateGradePublished]

		// Determine unaccepted works using number of students in classroom
		numStudents, err := s.store.GetNumberOfStudentsInClassroom(c.Context(), classroomID)
		if err != nil {
			return errs.InternalServerError()
		}
		notAcceptedWork := numStudents - acceptedWork - startedWork - submittedWork - workInGrading

		return c.Status(http.StatusOK).JSON(fiber.Map{
			"assignment_id": assignmentID,
			"status": fiber.Map{
				"not_accepted": notAcceptedWork,
				"accepted":     acceptedWork,
				"started":      startedWork,
				"submitted":    submittedWork,
				"in_grading":   workInGrading,
			},
		})
	}
}

func (s *AssignmentService) GetFirstCommitDate() fiber.Handler {
	return func(c *fiber.Ctx) error {
		assignmentID, err := strconv.Atoi(c.Params("assignment_id"))
		if err != nil {
			return errs.BadRequest(err)
		}

		earliestCommitDate, err := s.store.GetEarliestCommitDate(c.Context(), assignmentID)
		if err != nil {
			return err
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{
			"assignment_id":   assignmentID,
			"first_commit_at": earliestCommitDate,
		})
	}
}

func (s *AssignmentService) GetCommitCount() fiber.Handler {
	return func(c *fiber.Ctx) error {
		assignmentID, err := strconv.Atoi(c.Params("assignment_id"))
		if err != nil {
			return errs.BadRequest(err)
		}

		totalCommits, err := s.store.GetTotalWorkCommits(c.Context(), assignmentID)
		if err != nil {
			return errs.InternalServerError()
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{
			"assignment_id": assignmentID,
			"total_commits": totalCommits,
		})
	}
}
