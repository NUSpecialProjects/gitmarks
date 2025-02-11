package classrooms

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/CamPlume1/khoury-classroom/internal/errs"
	"github.com/CamPlume1/khoury-classroom/internal/handlers/common"
	"github.com/CamPlume1/khoury-classroom/internal/middleware"
	"github.com/CamPlume1/khoury-classroom/internal/models"
	"github.com/CamPlume1/khoury-classroom/internal/utils"
	"github.com/gofiber/fiber/v2"
)

// Helper method to check if a classroom exists
func (s *ClassroomService) doesClassroomExist(ctx context.Context, name string) (bool, error) {
	_, err := s.store.GetClassroomByName(ctx, name)
	return err == nil, nil // If no error, classroom exists
}

// Returns the classrooms the authenticated user is part of.
func (s *ClassroomService) getUserClassrooms() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Implement logic here
		return c.SendStatus(fiber.StatusNotImplemented)
	}
}

// Returns the details of a classroom.
func (s *ClassroomService) getClassroom() fiber.Handler {
	return func(c *fiber.Ctx) error {
		classroomID, err := strconv.ParseInt(c.Params("classroom_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		// Only allow TAs and Profs to get classroom info
		_, err = s.RequireAtLeastRole(c, classroomID, models.TA)
		if err != nil {
			return err
		}

		classroomData, err := s.store.GetClassroomByID(c.Context(), classroomID)
		if err != nil {
			return errs.InternalServerError()
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{"classroom": classroomData})
	}
}

func (s *ClassroomService) checkClassroomExists() fiber.Handler {
	return func(c *fiber.Ctx) error {
		classroomName := c.Params("classroom_name")
		if classroomName == "" {
			return errs.BadRequest(errors.New("classroom name is required"))
		}

		// Decode the URL-encoded classroom name
		decodedName, err := url.QueryUnescape(classroomName)
		if err != nil {
			return errs.BadRequest(errors.New("invalid classroom name encoding"))
		}

		exists, err := s.doesClassroomExist(c.Context(), decodedName)
		if err != nil {
			return errs.InternalServerError()
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{
			"exists": exists,
		})
	}
}

// Creates a new classroom.
func (s *ClassroomService) createClassroom() fiber.Handler {
	return func(c *fiber.Ctx) error {
		client, githubUser, user, err := middleware.GetClientAndUser(c, s.store, s.userCfg)
		if err != nil {
			return errs.AuthenticationError()
		}

		var classroomData models.Classroom
		err = c.BodyParser(&classroomData)
		if err != nil {
			return errs.InvalidRequestBody(models.Classroom{})
		}

		// check if classroom exists already
		exists, err := s.doesClassroomExist(c.Context(), classroomData.Name)
		if err != nil {
			return errs.InternalServerError()
		} else if exists {
			return c.Status(http.StatusConflict).SendString("Classroom already exists")
		}

		membership, err := client.GetUserOrgMembership(c.Context(), classroomData.OrgName, githubUser.Login)
		if err != nil || *membership.Role != "admin" {
			return errs.InsufficientPermissionsError()
		}

		// Determine the team name for the classroom
		studentTeamName := strings.ReplaceAll(strings.ToLower(classroomData.Name), " ", "-") + "-students"
		classroomData.StudentTeamName = &studentTeamName

		// Handle existing student team
		existingTeam, err := client.GetTeamByName(c.Context(), classroomData.OrgName, studentTeamName)
		if err == nil && existingTeam != nil {
			// Team exists - delete it first
			err = client.DeleteTeam(c.Context(), *existingTeam.ID)
			if err != nil {
				return errs.InternalServerError()
			}
		}

		// Create the student team
		description := "The students of " + classroomData.OrgName + " - " + classroomData.Name + ".\n\nAutomatically generated by Khoury Classroom."
		maintainers := []string{githubUser.Login}
		_, err = client.CreateTeam(c.Context(), classroomData.OrgName, *classroomData.StudentTeamName, &description, maintainers)
		if err != nil {
			return errs.InternalServerError()
		}

		// Create the classroom
		createdClassroom, err := s.store.CreateClassroom(c.Context(), classroomData)
		if err != nil {
			return errs.InternalServerError()
		}

		// Add the user as a professor to the classroom
		_, err = s.store.AddUserToClassroom(c.Context(), createdClassroom.ID, string(models.Professor), models.UserStatusActive, *user.ID)
		if err != nil {
			return errs.InternalServerError()
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{"classroom": createdClassroom})
	}
}

// Updates an existing classroom.
func (s *ClassroomService) updateClassroom() fiber.Handler {
	return func(c *fiber.Ctx) error {
		classroomID, err := strconv.ParseInt(c.Params("classroom_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		var classroomData models.Classroom
		error := c.BodyParser(&classroomData)
		if error != nil {
			return errs.InvalidRequestBody(models.Classroom{})
		}
		classroomData.ID = classroomID

		// Only allow professors to update classrooms
		_, err = s.RequireAtLeastRole(c, classroomID, models.Professor)
		if err != nil {
			return err
		}

		updatedClassroom, err := s.store.UpdateClassroom(c.Context(), classroomData)
		if err != nil {
			return errs.InternalServerError()
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{"classroom": updatedClassroom})
	}
}

// Updates the name of a classroom
func (s *ClassroomService) updateClassroomName() fiber.Handler {
	return func(c *fiber.Ctx) error {
		classroomID, err := strconv.ParseInt(c.Params("classroom_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		var classroomData models.Classroom
		error := c.BodyParser(&classroomData)
		if error != nil {
			return errs.InvalidRequestBody(models.Classroom{})
		}
		classroomData.ID = classroomID

		// Only allow professors to update classroom names
		_, err = s.RequireAtLeastRole(c, classroomID, models.Professor)
		if err != nil {
			return err
		}

		existingClassroom, err := s.store.GetClassroomByID(c.Context(), classroomID)
		if err != nil {
			return errs.InternalServerError()
		}
		existingClassroom.Name = classroomData.Name

		updatedClassroom, err := s.store.UpdateClassroom(c.Context(), existingClassroom)
		if err != nil {
			return errs.InternalServerError()
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{"classroom": updatedClassroom})
	}
}

// Returns the users of a classroom.
func (s *ClassroomService) getClassroomUsers() fiber.Handler {
	return func(c *fiber.Ctx) error {
		_, err := middleware.GetClient(c, s.store, s.userCfg)
		if err != nil {
			return errs.AuthenticationError()
		}

		classroomID, err := strconv.ParseInt(c.Params("classroom_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		// Only allow TAs and Profs to get users in classrooms
		_, err = s.RequireAtLeastRole(c, classroomID, models.TA)
		if err != nil {
			return err
		}

		classroom, err := s.store.GetClassroomByID(c.Context(), classroomID)
		if err != nil {
			return errs.InternalServerError()
		}

		usersInClassroom, err := s.store.GetUsersInClassroom(c.Context(), classroomID)
		if err != nil {
			return errs.InternalServerError()
		}

		updatedUsersInClassroom := []models.ClassroomUser{}

		for _, classroomUser := range usersInClassroom {
			newClassroomUser, err := common.UpdateUserStatus(c.Context(), s.appClient, s.store, classroomUser.User, classroom)
			// don't include members who are not in the org
			if newClassroomUser.Status == models.UserStatusRemoved {
				continue
			}
			if err != nil { // failed to update their status, so just keep the old one
				updatedUsersInClassroom = append(updatedUsersInClassroom, classroomUser)
			} else { // add the updated user to the list
				updatedUsersInClassroom = append(updatedUsersInClassroom, newClassroomUser)
			}
		}
		return c.Status(http.StatusOK).JSON(fiber.Map{"users": updatedUsersInClassroom})
	}
}

func (s *ClassroomService) getRubricsInClassroom() fiber.Handler {
	return func(c *fiber.Ctx) error {
		classroomID, err := strconv.ParseInt(c.Params("classroom_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		rubrics, err := s.store.GetRubricsInClassroom(c.Context(), classroomID)
		if err != nil {
			return errs.InternalServerError()
		}

		var fullRubrics []models.FullRubric
		for _, rubric := range rubrics {
			var fullRubric models.FullRubric
			fullRubric.Rubric = rubric

			items, err := s.store.GetRubricItems(c.Context(), rubric.ID)
			if err != nil {
				return errs.InternalServerError()
			}
			fullRubric.RubricItems = items

			fullRubrics = append(fullRubrics, fullRubric)
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{"full_rubrics": fullRubrics})
	}
}

// Removes a user from a classroom.
func (s *ClassroomService) removeUserFromClassroom() fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, err := strconv.ParseInt(c.Params("user_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		classroomID, err := strconv.ParseInt(c.Params("classroom_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		// Only allow professors to remove users from classrooms
		_, err = s.RequireAtLeastRole(c, classroomID, models.Professor)
		if err != nil {
			return err
		}

		classroom, err := s.store.GetClassroomByID(c.Context(), classroomID)
		if err != nil {
			return errs.InternalServerError()
		}

		studentTeam, err := s.appClient.GetTeamByName(c.Context(), classroom.OrgName, *classroom.StudentTeamName)
		if err != nil {
			return errs.InternalServerError()
		}

		toBeRemovedUser, err := s.store.GetUserByID(c.Context(), userID)
		if err != nil {
			return errs.InternalServerError()
		}

		// remove the user from the student team
		err = s.appClient.RemoveTeamMember(c.Context(), classroom.OrgName, *studentTeam.ID, toBeRemovedUser.GithubUsername)
		if err != nil {
			log.Default().Println("Warning: Failed to remove user from student team", err)
			// do nothing, the user has already been removed from the team or they were never in the team
		}

		err = s.store.RemoveUserFromClassroom(c.Context(), classroomID, userID)
		if err != nil {
			return errs.InternalServerError()
		}

		return c.SendStatus(http.StatusOK)
	}
}

// Generates a token to join a classroom.
func (s *ClassroomService) generateClassroomToken() fiber.Handler {
	return func(c *fiber.Ctx) error {
		body := models.ClassroomRoleRequestBody{}

		if err := c.BodyParser(&body); err != nil {
			return errs.InvalidRequestBody(body)
		}

		classroomID, err := strconv.ParseInt(c.Params("classroom_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		classroomRole, err := models.NewClassroomRole(body.ClassroomRole)
		if err != nil {
			return errs.BadRequest(err)
		}

		// Only allow professors to invite people to classrooms
		_, err = s.RequireAtLeastRole(c, classroomID, models.Professor)
		if err != nil {
			return err
		}

		// if the link is permenant, use the existing permanent token
		if body.Duration == nil {
			classroomToken, err := s.store.GetPermanentClassroomTokenByClassroomIDAndRole(c.Context(), classroomID, classroomRole)
			if err == nil {
				return c.Status(http.StatusOK).JSON(fiber.Map{"token": classroomToken.Token})
			}
		}

		token, err := utils.GenerateToken(16)
		if err != nil {
			return errs.InternalServerError()
		}

		tokenData := models.ClassroomToken{
			ClassroomID:   classroomID,
			ClassroomRole: classroomRole,
			BaseToken: models.BaseToken{
				Token: token,
			},
		}

		// Set ExpiresAt only if Duration is provided
		if body.Duration != nil {
			expiresAt := time.Now().Add(time.Duration(*body.Duration) * time.Minute)
			tokenData.ExpiresAt = &expiresAt
		}

		classroomToken, err := s.store.CreateClassroomToken(c.Context(), tokenData)
		if err != nil {
			return errs.InternalServerError()
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{"token": classroomToken.Token})
	}
}

// Uses a classroom token to request to join a classroom.
func (s *ClassroomService) useClassroomToken() fiber.Handler {
	return func(c *fiber.Ctx) error {
		client, _, user, err := middleware.GetClientAndUser(c, s.store, s.userCfg)
		if err != nil {
			return errs.AuthenticationError()
		}

		token := c.Params("token")
		if token == "" {
			return errs.MissingAPIParamError("token")
		}

		// Go get the token from the DB
		classroomToken, err := s.store.GetClassroomToken(c.Context(), token)
		if err != nil {
			return errs.AuthenticationError()
		}

		// Check if the token is valid
		if classroomToken.ExpiresAt != nil && classroomToken.ExpiresAt.Before(time.Now()) {
			return errs.ExpiredTokenError()
		}

		classroom, classroomUser, err := common.InviteUserToClassroom(c.Context(), s.store, s.appClient, client, classroomToken.ClassroomID, classroomToken.ClassroomRole, &user)
		if err != nil {
			return err
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{
			"message":        "Successfully joined classroom",
			"classroom_user": classroomUser,
			"classroom":      classroom,
		})
	}
}

// Returns the user's status in the classroom, nil if not in the classroom
func (s *ClassroomService) getCurrentClassroomUser() fiber.Handler {
	return func(c *fiber.Ctx) error {
		_, _, user, err := middleware.GetClientAndUser(c, s.store, s.userCfg)
		if err != nil {
			return errs.AuthenticationError()
		}

		classroomID, err := strconv.ParseInt(c.Params("classroom_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		classroom, err := s.store.GetClassroomByID(c.Context(), classroomID)
		if err != nil {
			return errs.InternalServerError()
		}

		classroomUser, err := common.UpdateUserStatus(c.Context(), s.appClient, s.store, user, classroom)
		if err != nil {
			if err == errs.UserNotFoundInClassroomError() {
				// User not found in classroom, return null
				return c.Status(http.StatusOK).JSON(fiber.Map{"user": nil})
			} else {
				return errs.InternalServerError()
			}
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{"user": classroomUser})
	}
}

// Sends an invite to a user to join the organization
func (s *ClassroomService) sendOrganizationInviteToUser() fiber.Handler {
	return func(c *fiber.Ctx) error {
		classroomID, err := strconv.ParseInt(c.Params("classroom_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		classroom, err := s.store.GetClassroomByID(c.Context(), classroomID)
		if err != nil {
			return errs.InternalServerError()
		}

		classroomRole, err := models.NewClassroomRole(c.Params("classroom_role"))
		if err != nil {
			return errs.BadRequest(err)
		}

		// Only allow professors to invite people to org
		_, err = s.RequireAtLeastRole(c, classroomID, models.Professor)
		if err != nil {
			return err
		}

		inviteeUserID, err := strconv.ParseInt(c.Params("user_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		invitee, err := s.store.GetUserInClassroom(c.Context(), classroomID, inviteeUserID)
		if err != nil {
			return errs.InternalServerError()
		}

		if invitee.Status == models.UserStatusRemoved {
			return errs.StudentRemovedFromClassroomError()
		}

		// use the current user's client to invite the user to the organization
		invitee, err = common.InviteUserToOrganization(c.Context(), s.appClient, s.store, classroom, classroomRole, invitee.User)
		if err != nil {
			return errs.InternalServerError()
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{
			"message": "Invite sent successfully",
			"user":    invitee,
		})
	}
}

// Removes a user from the requested state
func (s *ClassroomService) denyRequestedUser() fiber.Handler {
	return func(c *fiber.Ctx) error {
		classroomID, err := strconv.ParseInt(c.Params("classroom_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		userID, err := strconv.ParseInt(c.Params("user_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		// Only allow professors to remove users from classrooms
		_, err = s.RequireAtLeastRole(c, classroomID, models.Professor)
		if err != nil {
			return err
		}

		err = s.store.RemoveUserFromClassroom(c.Context(), classroomID, userID)
		if err != nil {
			return errs.InternalServerError()
		}

		return c.SendStatus(http.StatusOK)
	}
}

// Revokes an invite to a user to join the organization
func (s *ClassroomService) revokeOrganizationInvite() fiber.Handler {
	return func(c *fiber.Ctx) error {
		client, err := middleware.GetClient(c, s.store, s.userCfg)
		if err != nil {
			return errs.AuthenticationError()
		}

		classroomID, err := strconv.ParseInt(c.Params("classroom_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		targetUserID, err := strconv.ParseInt(c.Params("user_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		targetUser, err := s.store.GetUserInClassroom(c.Context(), classroomID, targetUserID)
		if err != nil {
			return errs.InternalServerError()
		}

		if targetUser.Status == models.UserStatusRemoved {
			return errs.StudentRemovedFromClassroomError()
		}

		// Only allow professors to remove users from classrooms
		_, err = s.RequireAtLeastRole(c, classroomID, models.Professor)
		if err != nil {
			return err
		}

		classroom, err := s.store.GetClassroomByID(c.Context(), classroomID)
		if err != nil {
			return errs.InternalServerError()
		}

		err = client.CancelOrgInvitation(c.Context(), classroom.OrgName, targetUser.GithubUsername)
		if err != nil {
			return errs.InternalServerError()
		}

		err = s.store.RemoveUserFromClassroom(c.Context(), classroomID, *targetUser.ID)
		if err != nil {
			return errs.InternalServerError()
		}

		return c.SendStatus(http.StatusOK)
	}
}

var semesterNameMap = map[time.Month]string{
	time.January:   "Spring",
	time.February:  "Spring",
	time.March:     "Spring",
	time.April:     "Spring",
	time.May:       "Summer 1",
	time.June:      "Summer 1",
	time.July:      "Summer 2",
	time.August:    "Summer 2",
	time.September: "Fall",
	time.October:   "Fall",
	time.November:  "Fall",
	time.December:  "Fall",
}

func (s *ClassroomService) getClassroomNames() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// get the current date
		now := time.Now()
		semesterNames := []string{}
		currentMonthIndex := int(now.Month())
		for i := currentMonthIndex; i < currentMonthIndex+12; i++ {
			// generate a full year of semester names (i.e. Fall 2024, Spring 2025, etc.)
			month := time.Month((i-1)%12 + 1)
			year := now.Year()
			if i > 12 { // if the month is past December, we need to roll over to the next year
				year = year + 1
			}
			semester, ok := semesterNameMap[month]
			if !ok {
				continue // Skip if month not found in map
			}
			semesterName := fmt.Sprintf("%s %d", semester, year)
			if !utils.Contains(semesterNames, semesterName) {
				semesterNames = append(semesterNames, semesterName)
			}
		}
		return c.Status(http.StatusOK).JSON(fiber.Map{"semester_names": semesterNames})
	}
}
