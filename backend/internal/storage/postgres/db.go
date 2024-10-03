package postgres

import (
	"context"
	"fmt"
	"github.com/CamPlume1/khoury-classroom/internal/config"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	connPool *pgxpool.Pool
}



// Establishes a postgres connection pool and returns it for querying.
func New(ctx context.Context, config config.Database) (*DB, error) {
	connPool, err := pgxpool.New(ctx, config.URL)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	
  fmt.Println("Successfully connected to the database!")
	return &DB{connPool: connPool}, nil
}

// Closes a connection pool
func (db *DB) Close(ctx context.Context) {
	db.connPool.Close()
  
}


