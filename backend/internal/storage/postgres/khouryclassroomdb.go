package postgres

import (
	"context"

	"github.com/CamPlume1/khoury-classroom/internal/models"
	"github.com/jackc/pgx/v5"
)

func (db *DB) GetUsers(ctx context.Context) ([]models.User, error) {
  rows, err := db.connPool.Query(ctx, "SELECT * FROM users")
  if err != nil {
    return nil, nil 
  }

  defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[models.User])
}
