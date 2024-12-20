package works

import (
	"fmt"
	"net/http"
	"regexp"
	"strconv"

	"github.com/CamPlume1/khoury-classroom/internal/errs"
	"github.com/CamPlume1/khoury-classroom/internal/github"
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
	supersedesMap := make(map[int]int) // maps comment id to the id of comment that it supersedes

	for _, comment := range comments {
		commentMap[comment.FeedbackCommentID] = comment
		if comment.SupersededBy != nil {
			supersedesMap[*comment.SupersededBy] = comment.FeedbackCommentID
		}
	}

	var formattedComments []models.FeedbackCommentWithHistory
	for _, comment := range comments {
		if comment.SupersededBy != nil {
			continue
		}

		var history []models.FeedbackCommentBase
		current := comment.FeedbackCommentBase

		for {
			if supersedesID, supersedesAnything := supersedesMap[current.FeedbackCommentID]; supersedesAnything {
				current = commentMap[supersedesID].FeedbackCommentBase
				history = append(history, current)
			} else {
				break
			}
		}

		formattedComments = append(formattedComments, models.FeedbackCommentWithHistory{
			FeedbackCommentBase: comment.FeedbackCommentBase,
			History:             history,
		})
	}

	return formattedComments
}

// takes a comment sent from our grader and formats it as a GitHub PR review comment
func formatFeedbackForGitHub(comment models.PRReviewCommentWithMetaData) models.PRReviewComment {
	// format comment: body -> [pt value] body
	// DO NOT TOUCH THE LINE BREAK IN THE PREFIX, IT IS NECESSARY
	prefix := fmt.Sprintf(`<!-- [CID:%d] -->
`, *comment.FeedbackCommentID)
	if comment.Points > 0 {
		prefix += fmt.Sprintf(LatexPositivePointPrefix, comment.Points)
	}
	if comment.Points < 0 {
		prefix += fmt.Sprintf(LatexNegativePointPrefix, comment.Points)
	}
	comment.PRReviewComment.Body = prefix + comment.PRReviewComment.Body
	return comment.PRReviewComment
}

func createComments(s *WorkService, c *fiber.Ctx, userClient github.GitHubUserClient, comments []models.PRReviewCommentWithMetaData, body string, work *models.PaginatedStudentWorkWithContributors, taUserID int64) error {
	var formattedComments []models.PRReviewComment
	// insert each comment into DB, then format for github
	for _, comment := range comments {
		var feedbackCommentID int
		var err error
		if comment.RubricItemID == nil {
			// create new rubric item and then attach
			feedbackCommentID, err = s.store.CreateFeedbackComment(c.Context(), taUserID, work.ID, comment)
		} else {
			// create from existing rubric item
			feedbackCommentID, err = s.store.CreateFeedbackCommentFromRubricItem(c.Context(), taUserID, work.ID, comment)
		}
		if err != nil {
			return err
		}
		comment.FeedbackCommentID = &feedbackCommentID
		formattedComments = append(formattedComments, formatFeedbackForGitHub(comment))
	}

	// create PR review via github API
	gitHubReview, err := userClient.CreatePRReview(c.Context(), work.OrgName, work.RepoName, body, formattedComments)
	if err != nil {
		return errs.GithubAPIError(err)
	}

	// fetch the comments we just created
	gitHubComments, err := userClient.GetPRReviewComments(c.Context(), work.OrgName, work.RepoName, *gitHubReview.ID)
	if err != nil {
		return errs.GithubAPIError(err)
	}
	for _, comment := range gitHubComments {
		pattern := `<!-- \[CID:(\d+)\] -->`
		re := regexp.MustCompile(pattern)

		// search for the CID in the string
		match := re.FindStringSubmatch(*comment.Body)

		// link the created comment to our record
		if len(match) > 1 {
			feedbackCommentID, _ := strconv.ParseInt(match[1], 10, 0)
			err = s.store.LinkFeedbackCommentWithGitHub(c.Context(), feedbackCommentID, *comment.ID)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func editComments(s *WorkService, c *fiber.Ctx, userClient github.GitHubUserClient, comments []models.PRReviewCommentWithMetaData, work *models.PaginatedStudentWorkWithContributors, taUserID int64) error {
	// create record of edit in DB
	for _, comment := range comments {
		err := s.store.EditFeedbackComment(c.Context(), taUserID, work.ID, comment)
		if err != nil {
			return err
		}
		err = userClient.EditPRReviewComment(c.Context(), work.OrgName, work.RepoName, comment.GitHubCommentID, formatFeedbackForGitHub(comment).Body)
		if err != nil {
			return errs.GithubAPIError(err)
		}
	}

	return nil
}

func deleteComments(s *WorkService, c *fiber.Ctx, userClient github.GitHubUserClient, comments []models.PRReviewCommentWithMetaData, work *models.PaginatedStudentWorkWithContributors, taUserID int64) error {
	// create record of edit in DB
	for _, comment := range comments {
		err := s.store.DeleteFeedbackComment(c.Context(), taUserID, work.ID, comment)
		if err != nil {
			return err
		}
		err = userClient.DeletePRReviewComment(c.Context(), work.OrgName, work.RepoName, comment.GitHubCommentID)
		if err != nil {
			return errs.GithubAPIError(err)
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

		var commentsToCreate, commentsToEdit, commentsToDelete []models.PRReviewCommentWithMetaData
		for _, comment := range requestBody.Comments {
			switch comment.Action {
			case "CREATE":
				commentsToCreate = append(commentsToCreate, comment)
			case "EDIT":
				commentsToEdit = append(commentsToEdit, comment)
			case "DELETE":
				commentsToDelete = append(commentsToDelete, comment)
			}
		}

		err = createComments(s, c, userClient, commentsToCreate, requestBody.Body, work, *taUser.ID)
		if err != nil {
			return err
		}
		err = editComments(s, c, userClient, commentsToEdit, work, *taUser.ID)
		if err != nil {
			return err
		}
		err = deleteComments(s, c, userClient, commentsToDelete, work, *taUser.ID)
		if err != nil {
			return err
		}
		return c.SendStatus(http.StatusOK)
	}
}
