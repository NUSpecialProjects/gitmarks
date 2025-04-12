package postgres

import (
	"context"
	"fmt"
	"time"
)

func (db *DB) GetDeadlineForRepo(ctx context.Context, repoName string) (*time.Time, error) {
	query := `
SELECT sw.unique_due_date FROM student_works as sw
WHERE sw.repo_name = $1;
`
	var uniqueDueDate *time.Time

	err := db.connPool.QueryRow(ctx, query, repoName).Scan(&uniqueDueDate)
	if err != nil {
		return nil, fmt.Errorf("error Retrieving Deadline: %s", err.Error())
	}

	return uniqueDueDate, nil
}

// Sets a due date for a specific student
func (db *DB) UpdateRepoDeadline(ctx context.Context, repoName string, due *time.Time) error {

	_, err := db.connPool.Exec(ctx, `
		UPDATE student_works
		SET unique_due_date = $1
		WHERE repo_name = $2;`, *due, repoName)
	return err
}

// Updates the due date for both the assignment and any associated student works
func (db *DB) UpdateAssignmentDeadline(ctx context.Context, ass_id string, due *time.Time) error {
	_, err := db.connPool.Exec(ctx, `
		UPDATE assignment_outline
		SET main_due_date = $1
		WHERE id = $2;`, *due, ass_id)
	if err != nil {
		return err
	}

	_, err = db.connPool.Exec(ctx, `
	UPDATE student_works
	SET unique_due_date = GREATEST($1, unique_due_date)
	WHERE assignment_outline_id = $2;`, *due, ass_id)
	if err != nil {
		return err
	}
	return nil
}
