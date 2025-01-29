package utils

import (
	"fmt"
	"time"
)

func ActionWithDeadline(deadline *time.Time) string {
  // yyyy, mm, dd, hh, mm, ss
	var scriptString = `name: deadline-enforcement
on:
  pull_request:
    types: [opened, reopened, edited, synchronize]

jobs:
  deadline-enforcement:
    runs-on: ubuntu-latest
    steps:
      - name: Execute python deadline check
        run: |
            python -c "
            from datetime import datetime, timezone
            import sys
            
            def check_date():
                target_date = datetime(%d, %d, %d, %d, %d, %d, tzinfo=timezone.utc)
                current_date = datetime.now(timezone.utc)
                if current_date > target_date:
                    sys.exit(1)
                else:
                    sys.exit(0)

            if __name__ == '__main__':
                check_date()
            "
`

	return fmt.Sprintf(scriptString, deadline.Year(), deadline.Month(), deadline.Day(), deadline.Hour(), deadline.Minute(), deadline.Second())
}


func TargetBranchProtectionAction() string {
    var actionString = `name: check-pr-target-branch

on:
  pull_request:
    types: [opened, reopened, edited, synchronize]

jobs:
  check-pr-target-branch:
    runs-on: ubuntu-latest
    steps:
      - name: Check PR destination branch
        run: |
          if [[ "${{ github.event.pull_request.base.ref }}" == "feedback" ]]; then
            echo "Error: Pull requests targeting the '' branch are not allowed"
            exit 1
          fi`
          return actionString
}