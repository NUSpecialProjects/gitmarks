package models

import (
	"time"
)

type AssignmentToken struct {
	AssignmentID int64 `json:"assignment_id"`
	BaseToken
}

type AssignmentTokenRequestBody struct {
	Duration *int `json:"duration,omitempty"`
}

type AssignmentOutline struct {
	ID              int32      `json:"id,omitempty" db:"id"`
	TemplateID      int64      `json:"template_id,omitempty"`
	BaseRepoID      int64      `json:"base_repo_id,omitempty" db:"base_repo_id"`
	CreatedAt       time.Time  `json:"created_at,omitempty"`
	ReleasedAt      *time.Time `json:"released_at,omitempty"`
	Name            string     `json:"name"`
	ClassroomID     int64      `json:"classroom_id"`
	RubricID        *int64     `json:"rubric_id,omitempty"`
	GroupAssignment bool       `json:"group_assignment"`
	MainDueDate     *time.Time `json:"main_due_date,omitempty"`
	DefaultScore    int        `json:"default_score"`
}

type AssignmentClassroomID struct {
	AssignmentClassroomID int64 `json:"assignment_classroom_id"`
}
