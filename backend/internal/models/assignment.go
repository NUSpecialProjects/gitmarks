package models

type Assignment struct {
	Rubric_ID    int32 `json:"rubric_id" db:"rubric_id"`
	Classroom_ID int32 `json:"classroom_id" db:"classroom_id"`
}
