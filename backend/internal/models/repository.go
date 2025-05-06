package models

// Repository represents a GitHub repository.
type Repository struct {
	ID            int64       `json:"id"`
	Name          string      `json:"name"`
	Owner         GitHubUser  `json:"owner"`
	Private       bool        `json:"private"`
	Description   *string     `json:"description,omitempty"`
	URL           string      `json:"url"`
	IsTemplate    bool        `json:"is_template"`
	Archived      bool        `json:"archived"`
	Parent        *Repository `json:"parent,omitempty"`
	FullName      string      `json:"full_name"`
	HTMLURL       string      `json:"html_url"`
	CloneURL      string      `json:"clone_url"`
	GitURL        string      `json:"git_url"`
	SSHURL        string      `json:"ssh_url"`
	Size          int64       `json:"size"`
	Language      string      `json:"language"`
	DefaultBranch *string     `json:"default_branch"`
}
