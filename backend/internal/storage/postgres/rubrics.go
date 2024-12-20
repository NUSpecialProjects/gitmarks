package postgres

import (
	"context"

	"github.com/CamPlume1/khoury-classroom/internal/errs"
	"github.com/CamPlume1/khoury-classroom/internal/models"
	"github.com/jackc/pgx/v5"
)

func (db *DB) CreateRubric(ctx context.Context, rubricData models.Rubric) (models.Rubric, error) {
	err := db.connPool.QueryRow(ctx, `INSERT INTO rubrics (name, org_id, classroom_id, reusable) VALUES ($1, $2, $3, $4) 
        RETURNING id, name, org_id, classroom_id, reusable, created_at`,
		rubricData.Name,
		rubricData.OrgID,
		rubricData.ClassroomID,
		rubricData.Reusable).Scan(
		&rubricData.ID,
		&rubricData.Name,
		&rubricData.OrgID,
		&rubricData.ClassroomID,
		&rubricData.Reusable,
		&rubricData.CreatedAt)
	if err != nil {
		return models.Rubric{}, errs.NewDBError(err)
	}

	return rubricData, nil
}

func (db *DB) AddItemToRubric(ctx context.Context, rubricItemData models.RubricItem) (models.RubricItem, error) {
	err := db.connPool.QueryRow(ctx, `INSERT INTO rubric_items (rubric_id, point_value, explanation) VALUES ($1, $2, $3) 
        RETURNING id, rubric_id, point_value, explanation, created_at`,
		rubricItemData.RubricID,
		rubricItemData.PointValue,
		rubricItemData.Explanation).Scan(
		&rubricItemData.ID,
		&rubricItemData.RubricID,
		&rubricItemData.PointValue,
		&rubricItemData.Explanation,
		&rubricItemData.CreatedAt)

	if err != nil {
		return models.RubricItem{}, errs.NewDBError(err)
	}

	return rubricItemData, nil
}

func (db *DB) GetRubric(ctx context.Context, rubricID int64) (models.Rubric, error) {
	var rubric models.Rubric
	err := db.connPool.QueryRow(ctx, "SELECT * FROM rubrics WHERE id = $1", rubricID).Scan(
		&rubric.ID,
		&rubric.Name,
		&rubric.OrgID,
		&rubric.ClassroomID,
		&rubric.Reusable,
		&rubric.CreatedAt)
	if err != nil {
		return models.Rubric{}, errs.NewDBError(err)
	}

	return rubric, nil
}

func (db *DB) GetRubricItems(ctx context.Context, rubricID int64) ([]models.RubricItem, error) {
	rows, err := db.connPool.Query(ctx, "SELECT * FROM rubric_items WHERE rubric_id = $1 AND deleted = FALSE", rubricID)
	if err != nil {
		return nil, errs.NewDBError(err)
	}

	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[models.RubricItem])
}

func (db *DB) UpdateRubric(ctx context.Context, rubricID int64, rubricData models.Rubric) (models.Rubric, error) {
	var updatedRubric models.Rubric
	err := db.connPool.QueryRow(ctx, `UPDATE rubrics SET name = $1, org_id = $2, classroom_id = $3,
        reusable = $4, created_at = $5 WHERE id = $6 
        RETURNING id, name, org_id, classroom_id, reusable, created_at`,
		rubricData.Name,
		rubricData.OrgID,
		rubricData.ClassroomID,
		rubricData.Reusable,
		rubricData.CreatedAt,
		rubricID).Scan(
		&updatedRubric.ID,
		&updatedRubric.Name,
		&updatedRubric.OrgID,
		&updatedRubric.ClassroomID,
		&updatedRubric.Reusable,
		&updatedRubric.CreatedAt)
	if err != nil {
		return models.Rubric{}, errs.NewDBError(err)
	}
	return updatedRubric, nil
}

func (db *DB) UpdateRubricItem(ctx context.Context, rubricItemData models.RubricItem) (models.RubricItem, error) {
	var updatedItem models.RubricItem
	err := db.connPool.QueryRow(ctx, `UPDATE rubric_items SET rubric_id = $1, point_value = $2, explanation = $3, created_at = $4, deleted = $5
        WHERE id = $6
        RETURNING id, rubric_id, point_value, explanation, created_at, deleted`,
		rubricItemData.RubricID,
		rubricItemData.PointValue,
		rubricItemData.Explanation,
		rubricItemData.CreatedAt,
		rubricItemData.Deleted,
		rubricItemData.ID).Scan(
		&updatedItem.ID,
		&updatedItem.RubricID,
		&updatedItem.PointValue,
		&updatedItem.Explanation,
		&updatedItem.CreatedAt,
		&updatedItem.Deleted)
	if err != nil {
		return models.RubricItem{}, errs.NewDBError(err)
	}
	return updatedItem, nil
}

func (db *DB) GetRubricsInClassroom(ctx context.Context, classroomID int64) ([]models.Rubric, error) {
	rows, err := db.connPool.Query(ctx, "SELECT * FROM rubrics WHERE classroom_id = $1", classroomID)
	if err != nil {
		return nil, errs.NewDBError(err)
	}

	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[models.Rubric])
}
