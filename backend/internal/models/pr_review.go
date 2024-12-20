package models

type PRReviewRequest struct {
	Body     string                        `json:"body"`
	Comments []PRReviewCommentWithMetaData `json:"comments"`
}

type PRReviewComment struct {
	Path *string `json:"path"`
	Line *int    `json:"line"`
	Body string  `json:"body"`
}

type PRReviewCommentAction string

const (
	PRReviewCommentActionCreate PRReviewCommentAction = "CREATE"
	PRReviewCommentActionEdit   PRReviewCommentAction = "EDIT"
	PRReviewCommentActionDelete PRReviewCommentAction = "DELETE"
)

type PRReviewCommentWithMetaData struct {
	PRReviewComment
	Action            PRReviewCommentAction `json:"action"`
	RubricItemID      *int                  `json:"rubric_item_id"`
	FeedbackCommentID *int                  `json:"feedback_comment_id"`
	Points            int                   `json:"points"`
	TAUsername        string                `json:"ta_username"`
	GitHubCommentID   int                   `json:"github_comment_id"`
}
