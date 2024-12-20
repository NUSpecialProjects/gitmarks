package errs

import (
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"reflect"
	"strings"

	"github.com/gofiber/fiber/v2"
)

type APIError struct {
	StatusCode int `json:"statusCode"`
	Message    any `json:"msg"`
}

func (e APIError) Error() string {
	return fmt.Sprintf("api error: %d %v", e.StatusCode, e.Message)
}

func NewAPIError(statusCode int, err error) APIError {
	return APIError{
		StatusCode: statusCode,
		Message:    err.Error(),
	}
}

func BadRequest(err error) APIError {
	return NewAPIError(http.StatusBadRequest, err)
}

func InvalidJSON() APIError {
	return NewAPIError(http.StatusBadRequest, errors.New("invalid JSON request data"))
}

func NotFound(title string, withKey string, withValue any) APIError {
	return NewAPIError(http.StatusNotFound, fmt.Errorf("%s with %s='%s' not found", title, withKey, withValue))
}

func NotFoundMultiple(title string, params map[string]string) APIError {
	var resp []string
	for key, value := range params {
		resp = append(resp, fmt.Sprintf("%s='%s'", key, value))
	}
	return NewAPIError(http.StatusNotFound, fmt.Errorf("%s with %s not found", title, strings.Join(resp, ", ")))
}

func Conflict(title string, withKey string, withValue any) APIError {
	return NewAPIError(http.StatusConflict, fmt.Errorf("conflict: %s with %s='%s' already exists", title, withKey, withValue))
}

func InvalidRequestData(errors map[string]string) APIError {
	return APIError{
		StatusCode: http.StatusUnprocessableEntity,
		Message:    errors,
	}
}

func ExpiredTokenError() APIError {
	return NewAPIError(http.StatusUnauthorized, errors.New("token expired"))
}

func InvalidRoleOperation() APIError {
	return NewAPIError(http.StatusBadRequest, errors.New("invalid role operation attempted"))
}

func InternalServerError() APIError {
	return NewAPIError(http.StatusInternalServerError, errors.New("internal server error"))
}

func GithubClientError(err error) APIError {
	return NewAPIError(http.StatusInternalServerError, fmt.Errorf("GitHub Client Error: %s", err.Error()))
}

func GithubAPIError(err error) APIError {
	return NewAPIError(http.StatusInternalServerError, fmt.Errorf("GitHub API Request Error: %s", err.Error()))
}

func MissingAPIParamError(field string) APIError {
	return NewAPIError(http.StatusBadRequest, fmt.Errorf("missing request field: %s", field))
}

func AuthenticationError() APIError {
	return NewAPIError(http.StatusForbidden, fmt.Errorf("please authenticate properly"))
}

func InsufficientPermissionsError() APIError {
	return NewAPIError(http.StatusForbidden, fmt.Errorf("user does not have sufficient permissions to perform this action"))
}

func StudentNotInStudentTeamError() APIError {
	return NewAPIError(http.StatusBadRequest, fmt.Errorf("student is not in the student team"))
}

func InconsistentOrgMembershipError() APIError {
	return NewAPIError(http.StatusBadRequest, fmt.Errorf("user status is inconsistent with org membership, were they removed from the GitHub organization?"))
}

func UserNotFoundInClassroomError() APIError {
	return NewAPIError(http.StatusBadRequest, fmt.Errorf("user is not in the classroom"))
}

func AssignmentNotAcceptedError() APIError {
	return NewAPIError(http.StatusBadRequest, fmt.Errorf("student has not accepted this assignment yet"))
}



func CriticalGithubError() APIError {
	return NewAPIError(http.StatusInternalServerError, fmt.Errorf("critical Out of State Error: Github Integration"))
}

func MissingDefaultBranchError() APIError {
	return NewAPIError(http.StatusBadRequest, fmt.Errorf("repository is missing a default branch"))

}

/* Post Requests Only */
func InvalidRequestBody(expected interface{}) APIError {
	fieldAcc := make([]string, 0, 10)

	// Use reflection to inspect the struct type
	t := reflect.TypeOf(expected)
	for i := 0; i < t.NumField(); i++ {
		field := t.Field(i)
		jsonTag := field.Tag.Get("json")
		if jsonTag != "" {
			fieldAcc = append(fieldAcc, jsonTag)
		}
	}

	msg := fmt.Sprintf("Expected Fields: %s", strings.Join(fieldAcc, ", "))
	return NewAPIError(http.StatusBadRequest, errors.New(msg))
}

func ErrorHandler(c *fiber.Ctx, err error) error {
	var apiErr APIError
	if castedErr, ok := err.(APIError); ok {
		apiErr = castedErr
	} else {
		apiErr = InternalServerError()
	}

	slog.Error("HTTP API error", "err", err.Error(), "method", c.Method(), "path", c.Path())

	return c.Status(apiErr.StatusCode).JSON(apiErr)
}
