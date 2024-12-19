package works

import (
	"fmt"
	"net/http"

	"github.com/CamPlume1/khoury-classroom/internal/errs"
	"github.com/CamPlume1/khoury-classroom/internal/middleware"
	"github.com/CamPlume1/khoury-classroom/internal/models"
	"github.com/gofiber/fiber/v2"
)

const LatexPositivePointPrefix = `$${\huge\color{limegreen}\textbf{[+%d]}}$$ `
const LatexNegativePointPrefix = `$${\huge\color{WildStrawberry}\textbf{[%d]}}$$ `

// takes a comment from our database and formats it for our grader to display
// by building a chronological history
func formatFeedbackForGrader(comments []models.FeedbackComment) []models.FeedbackCommentWithHistory {
	// convert to map for fast lookup
	commentMap := make(map[int]models.FeedbackComment)
	for _, comment := range comments {
		commentMap[comment.FeedbackCommentID] = comment
	}

	seen := make(map[int]bool)
	var formattedComments []models.FeedbackCommentWithHistory
	for _, comment := range comments {
		if seen[comment.FeedbackCommentID] {
			continue
		}

		// build comment history in "reverse" so that most recent is on top
		var history []models.FeedbackComment
		current := comment
		for current.SupersededBy != nil {
			history = append([]models.FeedbackComment{current}, history...)
			seen[current.FeedbackCommentID] = true
			next, exists := commentMap[*current.SupersededBy]
			if !exists {
				break
			}
			current = next
		}

		seen[current.FeedbackCommentID] = true
		formattedComments = append(formattedComments, models.FeedbackCommentWithHistory{
			FeedbackComment: current,
			History:         history,
		})
	}

	return formattedComments
}

// takes a comment sent from our grader and formats it as a GitHub PR review comment
func formatFeedbackForGitHub(comments []models.PRReviewCommentWithMetaData) []models.PRReviewComment {
	var formattedComments []models.PRReviewComment
	for _, comment := range comments {
		// format comment: body -> [pt value] body
		prefix := ""
		if comment.Points > 0 {
			prefix = fmt.Sprintf(LatexPositivePointPrefix, comment.Points)
		}
		if comment.Points < 0 {
			prefix = fmt.Sprintf(LatexNegativePointPrefix, comment.Points)
		}
		comment.PRReviewComment.Body = prefix + comment.PRReviewComment.Body
		formattedComments = append(formattedComments, comment.PRReviewComment)
	}

	return formattedComments
}

func insertFeedbackInDB(s *WorkService, c *fiber.Ctx, comments []models.PRReviewCommentWithMetaData, taUserID int64, workID int) error {
	// insert into DB, remove points field and format the body to display the points
	for _, comment := range comments {
		// insert into DB
		if comment.RubricItemID == nil {
			// create new rubric item and then attach
			err := s.store.CreateFeedbackComment(c.Context(), taUserID, workID, comment)
			if err != nil {
				return errs.InternalServerError()
			}
		} else {
			// attach rubric item
			err := s.store.CreateFeedbackCommentFromRubricItem(c.Context(), taUserID, workID, comment)
			if err != nil {
				return errs.InternalServerError()
			}
		}
	}
	return nil
}

func (s *WorkService) gradeWorkByID() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// get the work first
		work, err := s.getWork(c)
		if err != nil {
			return err
		}

		// get TA user id
		userClient, err := middleware.GetClient(c, s.store, s.userCfg)
		if err != nil {
			return errs.AuthenticationError()
		}
		taGHUser, err := userClient.GetCurrentUser(c.Context())
		if err != nil {
			return errs.AuthenticationError()
		}
		taUser, err := s.store.GetUserByGitHubID(c.Context(), taGHUser.ID)
		if err != nil {
			return errs.AuthenticationError()
		}

		var requestBody models.PRReviewRequest
		if err := c.BodyParser(&requestBody); err != nil {
			return errs.InvalidRequestBody(requestBody)
		}

		// create PR review via github API
		review, err := userClient.CreatePRReview(c.Context(), work.OrgName, work.RepoName, requestBody.Body, formatFeedbackForGitHub(requestBody.Comments))
		if err != nil {
			return errs.GithubAPIError(err)
		}

		// insert into DB
		err = insertFeedbackInDB(s, c, requestBody.Comments, *taUser.ID, work.ID)
		if err != nil {
			return err
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{
			"review": review,
		})
	}
}
