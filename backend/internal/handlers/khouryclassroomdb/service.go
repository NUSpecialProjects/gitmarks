package khouryclassroomdb

import (
  "github.com/CamPlume1/khoury-classroom/internal/storage"
)


type KCDBService struct {
  store storage.Storage
}


func newKCDBService(store storage.Storage) *KCDBService {
  return &KCDBService{store: store}

}
