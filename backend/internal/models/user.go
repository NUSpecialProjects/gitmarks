package models

import (
  "time"
)

type User struct {
  ID              int32     `json:"id"`
  Role            string    `json:"role"`
  Name            string    `json:"name"`
  GHUsername      string    `json:"gh_username" db:"gh_username"`
  JoinedOn        time.Time `json:"joined_on"`
}
