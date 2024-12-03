package classrooms

import (
	"context"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/CamPlume1/khoury-classroom/internal/errs"
	"github.com/CamPlume1/khoury-classroom/internal/github"
	"github.com/CamPlume1/khoury-classroom/internal/middleware"
	"github.com/CamPlume1/khoury-classroom/internal/models"
	"github.com/CamPlume1/khoury-classroom/internal/utils"
	"github.com/gofiber/fiber/v2"
)

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

		_, err = s.requireAtLeastRole(c, classroomID, models.Student) //TODO: this should be TA eventually
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

		membership, err := client.GetUserOrgMembership(c.Context(), classroomData.OrgName, githubUser.Login)
		if err != nil || *membership.Role != "admin" {
			return errs.InsufficientPermissionsError()
		}

		// Handle existing student team
		teamName := classroomData.Name + "-students"
		existingTeam, err := s.appClient.GetTeamByName(c.Context(), classroomData.OrgName, teamName)
		if err == nil && existingTeam != nil {
			// Team exists - delete it first
			err = s.appClient.DeleteTeam(c.Context(), *existingTeam.ID)
			if err != nil {
				return errs.InternalServerError()
			}
		}

		// Determine the team name for the classroom
		studentTeamName := strings.ReplaceAll(strings.ToLower(classroomData.Name), " ", "-") + "-students"
		classroomData.StudentTeamName = &studentTeamName

		// Create the student team
		description := "The students of " + classroomData.OrgName + " - " + classroomData.Name + ".\n\nAutomatically generated by Khoury Classroom."
		maintainers := []string{githubUser.Login}
		_, err = s.appClient.CreateTeam(c.Context(), classroomData.OrgName, *classroomData.StudentTeamName, &description, maintainers)
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

		_, err = s.requireAtLeastRole(c, classroomID, models.Professor)
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

		_, err = s.requireAtLeastRole(c, classroomID, models.Professor)
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
		client, err := middleware.GetClient(c, s.store, s.userCfg)
		if err != nil {
			return errs.AuthenticationError()
		}

		classroomID, err := strconv.ParseInt(c.Params("classroom_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		_, err = s.requireAtLeastRole(c, classroomID, models.Student) //TODO: this should be TA eventually
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
			newClassroomUser, err := s.updateUserStatus(c.Context(), client, classroomUser.User, classroom)
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

		_, err = s.requireAtLeastRole(c, classroomID, models.TA)
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

		if classroomRole == models.Professor {
			_, err = s.requireAtLeastRole(c, classroomID, classroomRole)
		} else {
			_, err = s.requireGreaterThanRole(c, classroomID, classroomRole)
		}
		if err != nil {
			return err
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

		// Get the classroom from the DB
		classroom, err := s.store.GetClassroomByID(c.Context(), classroomToken.ClassroomID)
		if err != nil {
			return errs.InternalServerError()
		}

		classroomUser, err := s.store.GetUserInClassroom(c.Context(), classroomToken.ClassroomID, *user.ID)
		if err != nil {
			classroomUser, err = s.store.AddUserToClassroom(c.Context(), classroomToken.ClassroomID, string(classroomToken.ClassroomRole), models.UserStatusRequested, *user.ID)
			if err != nil {
				return errs.InternalServerError()
			}
		}

		// don't do anything if the user has been removed from the classroom
		if classroomUser.Status == models.UserStatusRemoved {
			return errs.InsufficientPermissionsError()
		}

		// user is already in the classroom. If their role can be upgraded, do so. Don't downgrade them.
		roleComparison := classroomUser.Role.Compare(classroomToken.ClassroomRole)
		if roleComparison < 0 {
			// Upgrade the user's role in the classroom
			classroomUser, err = s.store.ModifyUserRole(c.Context(), classroomToken.ClassroomID, string(classroomToken.ClassroomRole), *classroomUser.ID)
			if err != nil {
				return errs.InternalServerError()
			}
		} else if roleComparison >= 0 {
			// User's current role is higher than token role, therefore do nothing and return an error
			return errs.InvalidRoleOperation()
		}

		// Invite the user to the organization
		// classroomUser, err = s.inviteUserToOrganization(c.Context(), s.appClient, classroom.OrgName, classroomToken.ClassroomID, classroomToken.ClassroomRole, user)
		classroomUser, err = s.inviteUserToOrganization(c.Context(), s.appClient, classroom, classroomToken.ClassroomRole, user)
		if err != nil {
			return errs.InternalServerError()
		}

		// Accept the pending invitation to the organization
		err = s.acceptOrgInvitation(c.Context(), client, classroom.OrgName, classroomToken.ClassroomID, user)
		if err != nil {
			return errs.InternalServerError()
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{
			"message":   "Token applied successfully",
			"user":      classroomUser,
			"classroom": classroom,
		})
	}
}

// Returns the user's status in the classroom, nil if not in the classroom
func (s *ClassroomService) getCurrentClassroomUser() fiber.Handler {
	return func(c *fiber.Ctx) error {
		client, _, user, err := middleware.GetClientAndUser(c, s.store, s.userCfg)
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

		classroomUser, err := s.updateUserStatus(c.Context(), client, user, classroom)
		if err != nil {
			if err == errs.UserNotFoundInClassroomError() {
				// User not found in classroom, return null
				return c.Status(http.StatusOK).JSON(fiber.Map{"user": nil})
			} else {
				return errs.InternalServerError()
			}
		}

		if classroomUser.Status == models.UserStatusNotInOrg || classroomUser.Status == models.UserStatusRemoved {
			return errs.InconsistentOrgMembershipError()
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{"user": classroomUser})
	}
}

// Updates the user's status in our DB to reflect their org membership, as of this moment
func (s *ClassroomService) updateUserStatus(ctx context.Context, client github.GitHubUserClient, user models.User, classroom models.Classroom) (models.ClassroomUser, error) {
	classroomUser, err := s.store.GetUserInClassroom(ctx, classroom.ID, *user.ID)
	if err != nil {
		return models.ClassroomUser{}, errs.UserNotFoundInClassroomError()
	}

	// if the user has been removed from the classroom, don't update their org membership
	if classroomUser.Status == models.UserStatusRemoved {
		return classroomUser, nil
	}

	membership, err := client.GetUserOrgMembership(ctx, classroom.OrgName, user.GithubUsername)
	if err != nil && classroomUser.Status != models.UserStatusRequested { // if the user is in the requested state, we don't want to change their status
		// user isn't in the org, set them to NOT IN ORG (this probably means they have been removed from the org OR they denied their invite)
		classroomUser, err = s.store.ModifyUserStatus(ctx, classroom.ID, models.UserStatusNotInOrg, *user.ID)
		if err != nil {
			return models.ClassroomUser{}, errs.InternalServerError()
		}
		return classroomUser, nil
	} else if membership != nil && *membership.State == "active" { // user is in the org, set them to active
		classroomUser, err = s.store.ModifyUserStatus(ctx, classroom.ID, models.UserStatusActive, *user.ID)
		if err != nil {
			return models.ClassroomUser{}, errs.InternalServerError()
		}
	} else if membership != nil && *membership.State == "pending" { // user has a pending invitation, set them to invited
		classroomUser, err = s.store.ModifyUserStatus(ctx, classroom.ID, models.UserStatusOrgInvited, *user.ID)
		if err != nil {
			return models.ClassroomUser{}, errs.InternalServerError()
		}
	}
	return classroomUser, nil
}

// Sends invites to all users in the classroom who are in the requested state
func (s *ClassroomService) sendOrganizationInvitesToRequestedUsers() fiber.Handler {
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

		_, err = s.requireGreaterThanRole(c, classroomID, classroomRole)
		if err != nil {
			return err
		}

		classroomUsers, err := s.store.GetUsersInClassroom(c.Context(), classroomID)
		if err != nil {
			return errs.InternalServerError()
		}

		stillRequestedUsers := []models.ClassroomUser{}
		invitedUsers := []models.ClassroomUser{}

		for _, classroomUser := range classroomUsers {
			if classroomUser.Status != models.UserStatusRequested {
				continue
			}
			//TODO: these are many content generating requests to the GitHub API, maybe need to delay between them
			// use the current user's client to invite the user to the organization
			modifiedClassroomUser, err := s.inviteUserToOrganization(c.Context(), s.appClient, classroom, classroomRole, classroomUser.User)
			if err != nil { // we failed to invite the user, but this is not a critical failure.
				stillRequestedUsers = append(stillRequestedUsers, classroomUser)
			} else {
				invitedUsers = append(invitedUsers, modifiedClassroomUser)
			}
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{
			"message":         "Invites sent successfully",
			"invited_users":   invitedUsers,
			"requested_users": stillRequestedUsers,
		})
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

		_, err = s.requireGreaterThanRole(c, classroomID, classroomRole)
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

		// use the current user's client to invite the user to the organization
		invitee, err = s.inviteUserToOrganization(c.Context(), s.appClient, classroom, classroomRole, invitee.User)
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

		targetUser, err := s.store.GetUserInClassroom(c.Context(), classroomID, userID)
		if err != nil {
			return errs.InternalServerError()
		}

		_, err = s.requireGreaterThanRole(c, classroomID, targetUser.Role)
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
		classroomID, err := strconv.ParseInt(c.Params("classroom_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		userID, err := strconv.ParseInt(c.Params("user_id"), 10, 64)
		if err != nil {
			return errs.BadRequest(err)
		}

		targetUser, err := s.store.GetUserInClassroom(c.Context(), classroomID, userID)
		if err != nil {
			return errs.InternalServerError()
		}

		_, err = s.requireGreaterThanRole(c, classroomID, targetUser.Role)
		if err != nil {
			return err
		}

		err = s.store.RemoveUserFromClassroom(c.Context(), classroomID, userID)
		if err != nil {
			return errs.InternalServerError()
		}

		classroom, err := s.store.GetClassroomByID(c.Context(), classroomID)
		if err != nil {
			return errs.InternalServerError()
		}

		err = s.appClient.CancelOrgInvitation(c.Context(), classroom.OrgName, targetUser.GithubUsername)
		if err != nil {
			return errs.InternalServerError()
		}

		return c.SendStatus(http.StatusOK)
	}
}

// Helper function to invite a user to the organization (delegates based on the role supplied)
func (s *ClassroomService) inviteUserToOrganization(ctx context.Context, client github.GitHubBaseClient, classroom models.Classroom, classroomRole models.ClassroomRole, user models.User) (models.ClassroomUser, error) {
	var classroomUser models.ClassroomUser
	var err error
	if classroomRole == models.Student {
		// Get the team ID
		studentTeam, err := client.GetTeamByName(ctx, classroom.OrgName, *classroom.StudentTeamName)
		if err != nil {
			return models.ClassroomUser{}, errs.InternalServerError()
		}

		// Invite the user to the organization
		classroomUser, err = s.inviteMemberToOrganization(ctx, client, *studentTeam.ID, classroom.ID, user)
		if err != nil {
			return models.ClassroomUser{}, errs.InternalServerError()
		}
	} else {
		// Invite the user to the organization
		classroomUser, err = s.inviteAdminToOrganization(ctx, client, classroom.OrgName, classroom.ID, user)
		if err != nil {
			return models.ClassroomUser{}, errs.InternalServerError()
		}
	}

	return classroomUser, nil
}

// Helper function to invite a student to the organization (adds them to the student team as well on acceptance)
func (s *ClassroomService) inviteMemberToOrganization(context context.Context, client github.GitHubBaseClient, teamID int64, classroomID int64, invitee models.User) (models.ClassroomUser, error) {
	err := client.AddTeamMember(context, teamID, invitee.GithubUsername, nil)
	if err != nil {
		return models.ClassroomUser{}, errs.InternalServerError()
	}
	classroomUser, err := s.store.ModifyUserStatus(context, classroomID, models.UserStatusOrgInvited, *invitee.ID)
	if err != nil {
		return models.ClassroomUser{}, errs.InternalServerError()
	}

	return classroomUser, nil
}

// Helper function to invite an admin to the organization
func (s *ClassroomService) inviteAdminToOrganization(context context.Context, client github.GitHubBaseClient, orgName string, classroomID int64, invitee models.User) (models.ClassroomUser, error) {
	err := client.SetUserMembershipInOrg(context, orgName, invitee.GithubUsername, "admin")
	if err != nil {
		return models.ClassroomUser{}, errs.InternalServerError()
	}
	classroomUser, err := s.store.ModifyUserStatus(context, classroomID, models.UserStatusOrgInvited, *invitee.ID)
	if err != nil {
		return models.ClassroomUser{}, errs.InternalServerError()
	}
	return classroomUser, nil
}

// Helper function to accept a pending invitation to an organization (Assumes there is a pending invitation)
func (s *ClassroomService) acceptOrgInvitation(context context.Context, userClient github.GitHubUserClient, orgName string, classroomID int64, invitee models.User) error {
	// user has a pending invitation, accept it
	err := userClient.AcceptOrgInvitation(context, orgName)
	if err != nil {
		return errs.InternalServerError()
	}
	_, err = s.store.ModifyUserStatus(context, classroomID, models.UserStatusActive, *invitee.ID)
	if err != nil {
		return errs.InternalServerError()
	}

	return nil
}

// Helper function to check if the user has at least the role specified
func (s *ClassroomService) requireAtLeastRole(c *fiber.Ctx, classroomID int64, role models.ClassroomRole) (models.ClassroomUser, error) {
	return s.checkRole(c, classroomID, role, func(userRole, requiredRole models.ClassroomRole) bool {
		return userRole.Compare(requiredRole) < 0
	})
}

func (s *ClassroomService) requireGreaterThanRole(c *fiber.Ctx, classroomID int64, role models.ClassroomRole) (models.ClassroomUser, error) {
	return s.checkRole(c, classroomID, role, func(userRole, requiredRole models.ClassroomRole) bool {
		return userRole.Compare(requiredRole) <= 0
	})
}

// Helper function containing shared role checking logic
func (s *ClassroomService) checkRole(c *fiber.Ctx, classroomID int64, role models.ClassroomRole, failCheck func(models.ClassroomRole, models.ClassroomRole) bool) (models.ClassroomUser, error) {
	_, _, user, err := middleware.GetClientAndUser(c, s.store, s.userCfg)
	if err != nil {
		return models.ClassroomUser{}, errs.AuthenticationError()
	}

	classroom, err := s.store.GetClassroomByID(c.Context(), classroomID)
	if err != nil {
		return models.ClassroomUser{}, errs.InternalServerError()
	}

	classroomUser, err := s.store.GetUserInClassroom(c.Context(), classroomID, *user.ID)
	if err != nil {
		return models.ClassroomUser{}, errs.InternalServerError()
	}

	// Check if user has sufficient role using provided comparison function
	if failCheck(classroomUser.Role, role) {
		return models.ClassroomUser{}, errs.InsufficientPermissionsError()
	}

	// if the user is removed or not in the org, they are not in the classroom
	if classroomUser.Status == models.UserStatusRemoved || classroomUser.Status == models.UserStatusNotInOrg {
		return models.ClassroomUser{}, errs.UserNotFoundInClassroomError()
	}

	// if the user is a student, check if they are in the student team
	if classroomUser.Role == models.Student {
		studentTeam, err := s.appClient.GetTeamByName(c.Context(), classroom.OrgName, *classroom.StudentTeamName)
		if err != nil { // student team doesn't exist :(
			return models.ClassroomUser{}, errs.InternalServerError()
		} else { // student team exists, check if the user is in it
			var studentIsInStudentTeam = false
			studentTeamMembers, err := s.appClient.GetTeamMembers(c.Context(), *studentTeam.ID)
			if err != nil {
				return models.ClassroomUser{}, errs.InternalServerError()
			}
			for _, member := range studentTeamMembers {
				if *member.Login == user.GithubUsername {
					studentIsInStudentTeam = true
				}
			}
			if !studentIsInStudentTeam {
				return models.ClassroomUser{}, errs.StudentNotInStudentTeamError()
			}
		}
	}

	return classroomUser, nil
}
