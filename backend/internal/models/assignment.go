package models

import "time"

type Assignment struct {
	RubricID              *int32     `json:"rubric_id,omitempty" db:"rubric_id,omitempty"`
	InsertedDate          time.Time  `json:"inserted_date" db:"inserted_date"`
	AssignmentClassroomID int64      `json:"assignment_classroom_id" db:"assignment_classroom_id"`
	ClassroomID           int64      `json:"classroom_id" db:"classroom_id"`
	Name                  string     `json:"name" db:"name"`
	MainDueDate           *time.Time `json:"main_due_date" db:"main_due_date"`
}

type AssignmentClassroomID struct {
	AssignmentClassroomID int64 `json:"assignment_classroom_id"`
}


type AssignmentAcceptRequest struct {
	OrgName string   		`json:"org_name"`	
	OrgID int 				`json:"org_id"`	
	SourceRepoName string 	`json:"repo_name"`	
	AssignmentName string	`json:"assignment_name"`	
	AssignmentID	int64	`json:"assignment_id"`	
}