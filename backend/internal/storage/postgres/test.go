package postgres

import (
	"context"

	"github.com/CamPlume1/khoury-classroom/internal/models"
	"github.com/jackc/pgx/v5"
)

func (db *DB) GetTests(ctx context.Context) ([]models.Test, error) {
	rows, err := db.connPool.Query(ctx, "SELECT * FROM test")
	if err != nil {
		return []models.Test{}, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[models.Test])
}
