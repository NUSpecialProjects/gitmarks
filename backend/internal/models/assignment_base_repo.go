package models

import (
	"time"
)

type AssignmentBaseRepo struct {
	BaseRepoOwner string    `json:"base_repo_owner"`
	BaseRepoName  string    `json:"base_repo_name"`
	BaseID        int64     `json:"base_repo_id"`
	CreatedAt     time.Time `json:"created_at,omitempty"`
	Initialized   bool      `json:"initialized"`
}
