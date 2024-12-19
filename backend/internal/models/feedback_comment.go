package models

import "time"

type FeedbackComment struct {
	FeedbackCommentID int       `json:"feedback_comment_id" db:"id"`
	StudentWorkID     int       `json:"student_work_id"`
	RubricItemID      int       `json:"rubric_item_id"`
	TAUserID          int       `json:"ta_user_id"`
	TAUsername        string    `json:"ta_username" db:"github_username"`
	PointValue        int       `json:"points"`
	Explanation       string    `json:"body"`
	FilePath          *string   `json:"path"`
	FileLine          *int      `json:"line"`
	CreatedAt         time.Time `json:"created_at"`
	SupersededBy      *int      `json:"superseded_by"`
}

type FeedbackCommentWithHistory struct {
	FeedbackComment
	History []FeedbackComment `json:"history"`
}
