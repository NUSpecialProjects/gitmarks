package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/CamPlume1/khoury-classroom/internal/models"
	"github.com/jackc/pgx/v5"
)

// gets all feedback comments on a student work
func (db *DB) GetFeedbackOnWork(ctx context.Context, studentWorkID int) ([]models.FeedbackComment, error) {
	query := `SELECT fc.*, ri.explanation, ri.point_value, u.github_username
	FROM feedback_comment fc
	JOIN rubric_items ri ON fc.rubric_item_id = ri.id
	JOIN users u ON fc.ta_user_id = u.id 
	WHERE student_work_id = $1`

	rows, err := db.connPool.Query(ctx, query, studentWorkID)

	if err != nil {
		fmt.Println("Error in query ", err)
		return nil, err
	}

	defer rows.Close()
	feedback, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.FeedbackComment])
	if err != nil {
		fmt.Println("Error collecting rows ", err)
		return nil, err
	}

	return feedback, err
}

// create a new feedback comment (ad-hoc: also create a rubric item simultaneously)
func (db *DB) CreateFeedbackComment(ctx context.Context, TAUserID int64, studentWorkID int, comment models.PRReviewCommentWithMetaData) (int, error) {
	var feedbackCommentID int
	err := db.connPool.QueryRow(ctx,
		`WITH ri AS
			(INSERT INTO rubric_items (point_value, explanation) VALUES ($1, $2) RETURNING id)
		INSERT INTO feedback_comment
			(rubric_item_id, file_path, file_line, student_work_id, ta_user_id)
			VALUES ((SELECT id FROM ri), $3, $4, $5, $6)
		RETURNING id`,
		comment.Points,
		comment.Body,
		comment.Path,
		comment.Line,
		studentWorkID,
		TAUserID,
	).Scan(&feedbackCommentID)

	return feedbackCommentID, err
}

// create a new feedback comment (attach existing rubric item)
func (db *DB) CreateFeedbackCommentFromRubricItem(ctx context.Context, TAUserID int64, studentWorkID int, comment models.PRReviewCommentWithMetaData) (int, error) {
	var feedbackCommentID int

	if comment.RubricItemID == nil {
		return feedbackCommentID, errors.New("no rubric item id given")
	}

	err := db.connPool.QueryRow(ctx,
		`INSERT INTO feedback_comment
				(rubric_item_id, file_path, file_line, student_work_id, ta_user_id)
				VALUES ($1, $2, $3, $4, $5)`,
		comment.RubricItemID,
		comment.Path,
		comment.Line,
		studentWorkID,
		TAUserID,
	).Scan(&feedbackCommentID)

	return feedbackCommentID, err
}

// edit a feedback comment
func (db *DB) EditFeedbackComment(ctx context.Context, TAUserID int64, studentWorkID int, comment models.PRReviewCommentWithMetaData) error {
	_, err := db.connPool.Exec(ctx,
		`WITH ri AS (
			INSERT INTO rubric_items (point_value, explanation)
			VALUES ($1, $2)
			RETURNING id
		),
		new AS (
			INSERT INTO feedback_comment
			(rubric_item_id, file_path, file_line, student_work_id, ta_user_id, github_comment_id)
			VALUES ((SELECT id FROM ri), $3, $4, $5, $6, $7)
			RETURNING id
		)
		UPDATE feedback_comment
			SET superseded_by = (SELECT id FROM new)
			WHERE id = $8`,
		comment.Points,
		comment.Body,
		comment.Path,
		comment.Line,
		studentWorkID,
		TAUserID,
		comment.GitHubCommentID,
		comment.FeedbackCommentID,
	)

	return err
}

// delete a feedback comment
func (db *DB) DeleteFeedbackComment(ctx context.Context, TAUserID int64, studentWorkID int, comment models.PRReviewCommentWithMetaData) error {
	_, err := db.connPool.Exec(ctx,
		`WITH fc AS (
			INSERT INTO feedback_comment
			(rubric_item_id, file_path, file_line, student_work_id, ta_user_id, github_comment_id, deleted)
			VALUES (1, $1, $2, $3, $4, $5, true)
			RETURNING id
		)
		UPDATE feedback_comment
			SET superseded_by = (SELECT id FROM fc)
			WHERE id = $6`,
		comment.Path,
		comment.Line,
		studentWorkID,
		TAUserID,
		comment.GitHubCommentID,
		comment.FeedbackCommentID,
	)

	return err
}

// updates a feedback comment in our DB with the ID of the newly created corresponding github comment ID
func (db *DB) LinkFeedbackCommentWithGitHub(ctx context.Context, feedbackCommentID, gitHubCommentID int64) error {
	_, err := db.connPool.Exec(ctx,
		`UPDATE feedback_comment SET github_comment_id = $1 WHERE id = $2`,
		gitHubCommentID,
		feedbackCommentID,
	)

	return err
}
