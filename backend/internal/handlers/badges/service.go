package badges

import (
	"github.com/CamPlume1/khoury-classroom/internal/storage"
)

type BadgesService struct {
	store storage.Storage
}

func NewBadgesService(store storage.Storage) *BadgesService {
	return &BadgesService{store: store}
}
