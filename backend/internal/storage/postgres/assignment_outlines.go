package postgres

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/CamPlume1/khoury-classroom/internal/errs"
	"github.com/CamPlume1/khoury-classroom/internal/models"
	"github.com/jackc/pgx/v5"
)

func (db *DB) CreateAssignmentToken(ctx context.Context, tokenData models.AssignmentToken) (models.AssignmentToken, error) {
	err := db.connPool.QueryRow(ctx, `
	INSERT INTO assignment_outline_tokens (assignment_outline_id, token, expires_at)
	VALUES ($1, $2, $3)
	RETURNING assignment_outline_id, token, created_at, expires_at`,
		tokenData.AssignmentID,
		tokenData.Token,
		tokenData.ExpiresAt,
	).Scan(
		&tokenData.AssignmentID,
		&tokenData.Token,
		&tokenData.CreatedAt,
		&tokenData.ExpiresAt,
	)

	if err != nil {
		return models.AssignmentToken{}, errs.NewDBError(err)
	}

	return tokenData, nil
}

func (db *DB) GetAssignmentByToken(ctx context.Context, token string) (models.AssignmentOutline, error) {
	var assignmentOutline models.AssignmentOutline
	err := db.connPool.QueryRow(ctx, `
	SELECT ao.*
	FROM assignment_outlines ao
	JOIN assignment_outline_tokens aot
		ON ao.id = aot.assignment_outline_id
	WHERE aot.token = $1`, token).Scan(
		&assignmentOutline.ID,
		&assignmentOutline.TemplateID,
		&assignmentOutline.BaseRepoID,
		&assignmentOutline.CreatedAt,
		&assignmentOutline.ReleasedAt,
		&assignmentOutline.Name,
		&assignmentOutline.ClassroomID,
		&assignmentOutline.RubricID,
		&assignmentOutline.GroupAssignment,
		&assignmentOutline.MainDueDate,
		&assignmentOutline.DefaultScore,
	)
	if err != nil {
		return models.AssignmentOutline{}, errs.NewDBError(err)
	}

	return assignmentOutline, nil
}

func (db *DB) GetAssignmentsInClassroom(ctx context.Context, classroomID int64) ([]models.AssignmentOutline, error) {
	rows, err := db.connPool.Query(ctx, "SELECT * FROM assignment_outlines WHERE classroom_id = $1", classroomID)
	if err != nil {
		return nil, errs.NewDBError(err)
	}

	return pgx.CollectRows(rows, pgx.RowToStructByName[models.AssignmentOutline])
}

func (db *DB) GetAssignmentByID(ctx context.Context, assignmentID int64) (models.AssignmentOutline, error) {
	var assignmentOutline models.AssignmentOutline
	err := db.connPool.QueryRow(ctx, "SELECT * FROM assignment_outlines WHERE id = $1", assignmentID).Scan(
		&assignmentOutline.ID,
		&assignmentOutline.TemplateID,
		&assignmentOutline.BaseRepoID,
		&assignmentOutline.CreatedAt,
		&assignmentOutline.ReleasedAt,
		&assignmentOutline.Name,
		&assignmentOutline.ClassroomID,
		&assignmentOutline.RubricID,
		&assignmentOutline.GroupAssignment,
		&assignmentOutline.MainDueDate,
		&assignmentOutline.DefaultScore,
	)
	if err != nil {
		return models.AssignmentOutline{}, errs.NewDBError(err)
	}

	return assignmentOutline, nil
}

func (db *DB) CreateAssignment(ctx context.Context, assignmentRequestData models.AssignmentOutline) (models.AssignmentOutline, error) {
	var assignmentOutline models.AssignmentOutline

	err := db.connPool.QueryRow(ctx, `
		INSERT INTO assignment_outlines (template_id, base_repo_id, name, classroom_id, rubric_id, group_assignment, main_due_date, default_score)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id,
			template_id,
			base_repo_id,
			created_at,
			released_at,
			name,
			classroom_id,
			rubric_id,
			group_assignment,
			main_due_date,
			default_score
	`,
		assignmentRequestData.TemplateID,
		assignmentRequestData.BaseRepoID,
		assignmentRequestData.Name,
		assignmentRequestData.ClassroomID,
		assignmentRequestData.RubricID,
		assignmentRequestData.GroupAssignment,
		assignmentRequestData.MainDueDate,
		assignmentRequestData.DefaultScore,
	).Scan(&assignmentOutline.ID,
		&assignmentOutline.TemplateID,
		&assignmentOutline.BaseRepoID,
		&assignmentOutline.CreatedAt,
		&assignmentOutline.ReleasedAt,
		&assignmentOutline.Name,
		&assignmentOutline.ClassroomID,
		&assignmentOutline.RubricID,
		&assignmentOutline.GroupAssignment,
		&assignmentOutline.MainDueDate,
		&assignmentOutline.DefaultScore,
	)

	if err != nil {
		return assignmentOutline, errs.NewDBError(err)
	}
	return assignmentOutline, nil
}

func (db *DB) GetAssignmentByBaseRepoID(ctx context.Context, baseRepoID int64) (models.AssignmentOutline, error) {
	var assignmentOutline models.AssignmentOutline
	err := db.connPool.QueryRow(ctx, "SELECT * FROM assignment_outlines WHERE base_repo_id = $1", baseRepoID).Scan(
		&assignmentOutline.ID,
		&assignmentOutline.TemplateID,
		&assignmentOutline.BaseRepoID,
		&assignmentOutline.CreatedAt,
		&assignmentOutline.ReleasedAt,
		&assignmentOutline.Name,
		&assignmentOutline.ClassroomID,
		&assignmentOutline.RubricID,
		&assignmentOutline.GroupAssignment,
		&assignmentOutline.MainDueDate,
		&assignmentOutline.DefaultScore,
	)

	if err != nil {
		return assignmentOutline, errs.NewDBError(err)
	}

	return assignmentOutline, nil
}

func (db *DB) GetAssignmentByNameAndClassroomID(ctx context.Context, assignmentName string, classroom int64) (*models.AssignmentOutline, error) {
	var assignmentOutline models.AssignmentOutline
	err := db.connPool.QueryRow(ctx, "SELECT * FROM assignment_outlines WHERE name = $1 AND classroom_id = $2", assignmentName, classroom).Scan(
		&assignmentOutline.ID,
		&assignmentOutline.TemplateID,
		&assignmentOutline.BaseRepoID,
		&assignmentOutline.CreatedAt,
		&assignmentOutline.ReleasedAt,
		&assignmentOutline.Name,
		&assignmentOutline.ClassroomID,
		&assignmentOutline.RubricID,
		&assignmentOutline.GroupAssignment,
		&assignmentOutline.MainDueDate,
		&assignmentOutline.DefaultScore,
	)

	if err != nil {
		return nil, err
	}

	return &assignmentOutline, nil
}

func (db *DB) UpdateAssignmentRubric(ctx context.Context, rubricID int64, assignmentID int64) (models.AssignmentOutline, error) {
	var updatedAssignmentData models.AssignmentOutline
	err := db.connPool.QueryRow(ctx, `UPDATE assignment_outlines SET rubric_id = $1 WHERE id = $2 
        RETURNING id, template_id, created_at, released_at, name, classroom_id, rubric_id, group_assignment, main_due_date, default_score`,
		rubricID, assignmentID).Scan(
		&updatedAssignmentData.ID,
		&updatedAssignmentData.TemplateID,
		&updatedAssignmentData.CreatedAt,
		&updatedAssignmentData.ReleasedAt,
		&updatedAssignmentData.Name,
		&updatedAssignmentData.ClassroomID,
		&updatedAssignmentData.RubricID,
		&updatedAssignmentData.GroupAssignment,
		&updatedAssignmentData.MainDueDate,
		&updatedAssignmentData.DefaultScore,
	)

	if err != nil {
		return models.AssignmentOutline{}, errs.NewDBError(err)
	}

	return updatedAssignmentData, nil
}

func (db *DB) GetEarliestCommitDate(ctx context.Context, assignmentID int) (*time.Time, error) {
	var earliestCommitDate *time.Time
	err := db.connPool.QueryRow(ctx, `
		SELECT MIN(first_commit_date)
		FROM student_works
		WHERE assignment_outline_id = $1
	`, assignmentID).Scan(&earliestCommitDate)
	if err != nil {
		return nil, err
	}

	return earliestCommitDate, nil
}

func (db *DB) GetTotalWorkCommits(ctx context.Context, assignmentID int) (int, error) {
	var totalCommits int
	err := db.connPool.QueryRow(ctx, `
		SELECT SUM(commit_amount) 
		FROM student_works 
		WHERE assignment_outline_id = $1
	`, assignmentID).Scan(&totalCommits)
	if err != nil {
		return 0, err
	}

	return totalCommits, nil
}

func (db *DB) CountWorksByState(ctx context.Context, assignmentID int) (map[models.WorkState]int, error) {
	// Initialize the count map with all possible WorkState values set to zero
	workStateCounts := make(map[models.WorkState]int)
	for _, state := range models.WorkStateEnum {
		workStateCounts[state] = 0
	}

	// Query for the count of student works by status
	rows, err := db.connPool.Query(ctx, `SELECT work_state, COUNT(*) AS state_count
		FROM student_works
		WHERE assignment_outline_id = $1
		GROUP BY work_state;`, assignmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Scan and populate the count map
	for rows.Next() {
		var workState models.WorkState
		var count int
		if err := rows.Scan(&workState, &count); err != nil {
			return nil, err
		}
		workStateCounts[workState] = count
	}

	// Check for errors during iteration
	if rows.Err() != nil {
		return nil, rows.Err()
	}

	return workStateCounts, nil
}

func (db *DB) GetAssignmentByRepoName(ctx context.Context, repoName string) (*models.AssignmentOutline, error){
	var outline models.AssignmentOutline
	 row := db.connPool.QueryRow(ctx, `SELECT ao.id, ao.template_id, ao.base_repo_id, ao.classroom_id, ao.created_at, ao.released_at, ao.name, ao.rubric_id, ao.group_assignment, ao.default_score, ao.main_due_date
			FROM assignment_outlines ao
			JOIN assignment_base_repos at ON ao.base_repo_id = at.base_repo_id
			WHERE at.base_repo_name ILIKE $1;`, strings.ToLower(repoName))
	err := row.Scan(&outline.ID,
				&outline.TemplateID,
				&outline.BaseRepoID,
				&outline.ClassroomID,
				&outline.CreatedAt,
				&outline.ReleasedAt,
				&outline.Name,
				&outline.RubricID,
				&outline.GroupAssignment,
				&outline.DefaultScore,
				&outline.MainDueDate)																					
	if err != nil {
		fmt.Println("oof")
		fmt.Println(err)
		return nil, err
	}
	return &outline, nil
}