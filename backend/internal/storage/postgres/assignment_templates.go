package postgres

import (
	"context"
	"strings"

	"github.com/CamPlume1/khoury-classroom/internal/errs"
	"github.com/CamPlume1/khoury-classroom/internal/models"
)

func (db *DB) AssignmentTemplateExists(ctx context.Context, templateID int64) (bool, error) {
	var exists bool
	err := db.connPool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM assignment_templates WHERE template_repo_id = $1)", templateID).Scan(&exists)
	if err != nil {
		return false, errs.NewDBError(err)
	}

	return exists, nil
}

func (db *DB) CreateAssignmentTemplate(ctx context.Context, assignmentTemplateData models.AssignmentTemplate) (models.AssignmentTemplate, error) {
	err := db.connPool.QueryRow(ctx, `INSERT INTO assignment_templates (template_repo_owner, template_repo_name, template_repo_id)
			VALUES ($1, $2, $3)
			RETURNING *`,
		assignmentTemplateData.TemplateRepoOwner,
		strings.ToLower(assignmentTemplateData.TemplateRepoName),
		assignmentTemplateData.TemplateID,
	).Scan(&assignmentTemplateData.TemplateID,
		&assignmentTemplateData.TemplateRepoOwner,
		&assignmentTemplateData.TemplateRepoName,
		&assignmentTemplateData.CreatedAt)

	if err != nil {
		return models.AssignmentTemplate{}, errs.NewDBError(err)
	}

	return assignmentTemplateData, nil
}

func (db *DB) GetAssignmentTemplateByID(ctx context.Context, templateID int64) (models.AssignmentTemplate, error) {
	var assignmentTemplate models.AssignmentTemplate
	err := db.connPool.QueryRow(ctx, "SELECT * FROM assignment_templates WHERE template_repo_id = $1", templateID).Scan(
		&assignmentTemplate.TemplateID,
		&assignmentTemplate.TemplateRepoOwner,
		&assignmentTemplate.TemplateRepoName,
		&assignmentTemplate.CreatedAt,
	)
	if err != nil {
		return models.AssignmentTemplate{}, errs.NewDBError(err)
	}

	return assignmentTemplate, nil
}

func (db *DB) GetAssignmentByRepoName(ctx context.Context, repoName string) (*models.AssignmentOutline, error){
	var assignment models.AssignmentOutline
			err := db.connPool.QueryRow(ctx, `SELECT *
					FROM assignment_outlines ao
					JOIN assignment_base_repos at ON ao.base_repo_id = at.base_repo_id
					WHERE at.base_repo_name ILIKE $1;`, strings.ToLower(repoName)).Scan(&assignment)
	if err != nil {
		return nil, err
	}
	return &assignment, nil
}