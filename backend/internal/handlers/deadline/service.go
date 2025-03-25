package deadline

import (
	"github.com/CamPlume1/khoury-classroom/internal/storage"
)

type DeadlineService struct {
	store     storage.Storage
}

func newDeadlineService(
	store storage.Storage,
) *DeadlineService {
	return &DeadlineService{
		store:     store,
	}
}
