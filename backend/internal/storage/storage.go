package storage

import (
	"context"

	"github.com/CamPlume1/khoury-classroom/internal/models"
)

type Storage interface {
	Close (context.Context)
	Test
  KhouryClassroomDB
}


type Test interface {
	GetTests(ctx context.Context) ([]models.Test, error)
}

type KhouryClassroomDB interface {
  GetUsers(ctx context.Context) ([]models.User, error)
}
