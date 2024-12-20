package models


type RepositoryAddition struct {
	FilePath string
	RepoName string
	OwnerName string
	DestinationBranch string
	Content string
	CommitMessage string
}