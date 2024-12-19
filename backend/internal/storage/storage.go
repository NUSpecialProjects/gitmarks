package storage

import (
	"context"
	"time"

	"github.com/CamPlume1/khoury-classroom/internal/models"
)

type Storage interface {
	Close(context.Context)
	FeedbackComment
	Works
	Test
	Session
	Classroom
	User
	AssignmentOutline
	Rubric
	AssignmentTemplate
	AssignmentBaseRepo
}

type FeedbackComment interface {
	GetFeedbackOnWork(ctx context.Context, studentWorkID int) ([]models.PRReviewCommentResponse, error)
	CreateFeedbackComment(ctx context.Context, TAUserID int64, studentWorkID int, comment models.PRReviewCommentResponse) error
	CreateFeedbackCommentFromRubricItem(ctx context.Context, TAUserID int64, studentWorkID int, comment models.PRReviewCommentResponse) error
}

type Works interface {
	GetWorks(ctx context.Context, classroomID int, assignmentID int) ([]*models.StudentWorkWithContributors, error)
	GetWork(ctx context.Context, classroomID int, assignmentID int, studentWorkID int) (*models.PaginatedStudentWorkWithContributors, error)
	CreateStudentWork(ctx context.Context, assignmentOutlineID int32, gitHubUserID int64, repoName string, workState models.WorkState, dueDate *time.Time) (models.StudentWork, error)
	UpdateStudentWork(ctx context.Context, UpdateStudentWork models.StudentWork) (models.StudentWork, error)
	GetWorkByRepoName(ctx context.Context, repoName string) (models.StudentWork, error)
}

type Test interface {
	GetTests(ctx context.Context) ([]models.Test, error)
}

type Session interface {
	CreateSession(ctx context.Context, sessionData models.Session) error
	GetSession(ctx context.Context, gitHubUserID int64) (models.Session, error)
	DeleteSession(ctx context.Context, gitHubUserID int64) error
}

type Classroom interface {
	CreateClassroom(ctx context.Context, classroomData models.Classroom) (models.Classroom, error)
	UpdateClassroom(ctx context.Context, classroomData models.Classroom) (models.Classroom, error)
	GetClassroomByID(ctx context.Context, classroomID int64) (models.Classroom, error)
	AddUserToClassroom(ctx context.Context, classroomID int64, classroomRole string, classroomStatus models.UserStatus, userID int64) (models.ClassroomUser, error)
	RemoveUserFromClassroom(ctx context.Context, classroomID int64, userID int64) error
	ModifyUserRole(ctx context.Context, classroomID int64, classroomRole string, userID int64) (models.ClassroomUser, error)
	ModifyUserStatus(ctx context.Context, classroomID int64, status models.UserStatus, userID int64) (models.ClassroomUser, error)
	GetUsersInClassroom(ctx context.Context, classroomID int64) ([]models.ClassroomUser, error)
	GetUserInClassroom(ctx context.Context, classroomID int64, userID int64) (models.ClassroomUser, error)
	GetClassroomsInOrg(ctx context.Context, orgID int64) ([]models.Classroom, error)
	GetUserClassroomsInOrg(ctx context.Context, orgID int64, userID int64) ([]models.ClassroomUser, error)
	CreateClassroomToken(ctx context.Context, tokenData models.ClassroomToken) (models.ClassroomToken, error)
	GetClassroomToken(ctx context.Context, token string) (models.ClassroomToken, error)
	GetPermanentClassroomTokenByClassroomIDAndRole(ctx context.Context, classroomID int64, classroomRole models.ClassroomRole) (models.ClassroomToken, error)
	GetNumberOfStudentsInClassroom(ctx context.Context, classroomID int64) (int, error)
}

type User interface {
	CreateUser(ctx context.Context, userToCreate models.User) (models.User, error)
	GetUserByGitHubID(ctx context.Context, githubUserID int64) (models.User, error)
	GetUserByID(ctx context.Context, userID int64) (models.User, error)
}

type AssignmentOutline interface {
	GetAssignmentsInClassroom(ctx context.Context, classroomID int64) ([]models.AssignmentOutline, error)
	GetAssignmentByID(ctx context.Context, assignmentID int64) (models.AssignmentOutline, error)
	GetAssignmentByBaseRepoID(ctx context.Context, baseRepoID int64) (models.AssignmentOutline, error)
	GetAssignmentByNameAndClassroomID(ctx context.Context, assignmentName string, classroom int64) (*models.AssignmentOutline, error)
	CreateAssignment(ctx context.Context, assignmentData models.AssignmentOutline) (models.AssignmentOutline, error)
	UpdateAssignmentRubric(ctx context.Context, rubricID int64, assignmentID int64) (models.AssignmentOutline, error)
	CountWorksByState(ctx context.Context, assignmentID int) (map[models.WorkState]int, error)
	GetEarliestCommitDate(ctx context.Context, assignmentID int) (*time.Time, error)
	GetTotalWorkCommits(ctx context.Context, assignmentID int) (int, error)
	GetAssignmentByToken(ctx context.Context, token string) (models.AssignmentOutline, error)
	CreateAssignmentToken(ctx context.Context, tokenData models.AssignmentToken) (models.AssignmentToken, error)
	GetPermanentAssignmentTokenByAssignmentID(ctx context.Context, assignmentID int64) (models.AssignmentToken, error)
}

type AssignmentTemplate interface {
	AssignmentTemplateExists(ctx context.Context, templateID int64) (bool, error)
	CreateAssignmentTemplate(ctx context.Context, assignmentTemplateData models.AssignmentTemplate) (models.AssignmentTemplate, error)
	GetAssignmentTemplateByID(ctx context.Context, templateID int64) (models.AssignmentTemplate, error)
	GetAssignmentTemplateByAssignmentID(ctx context.Context, assignmentID int64) (models.AssignmentTemplate, error)
}

type AssignmentBaseRepo interface {
	CreateBaseRepo(ctx context.Context, baseRepoData models.AssignmentBaseRepo) error
	GetBaseRepoByID(ctx context.Context, id int64) (models.AssignmentBaseRepo, error)
}

type Rubric interface {
	CreateRubric(ctx context.Context, rubricData models.Rubric) (models.Rubric, error)
	GetRubric(ctx context.Context, rubricID int64) (models.Rubric, error)
	AddItemToRubric(ctx context.Context, rubricItemData models.RubricItem) (models.RubricItem, error)
	GetRubricItems(ctx context.Context, rubricID int64) ([]models.RubricItem, error)
	UpdateRubric(ctx context.Context, rubricID int64, rubricData models.Rubric) (models.Rubric, error)
	UpdateRubricItem(ctx context.Context, rubricItemData models.RubricItem) (models.RubricItem, error)
	GetRubricsInClassroom(ctx context.Context, classroomID int64) ([]models.Rubric, error)
}
