package common

import (
	"context"

	"github.com/CamPlume1/khoury-classroom/internal/errs"
	"github.com/CamPlume1/khoury-classroom/internal/github"
	"github.com/CamPlume1/khoury-classroom/internal/models"
	"github.com/CamPlume1/khoury-classroom/internal/storage"
)

// Updates the user's status in our DB to reflect their org membership, as of this moment
// Note: currently only works for the app client as the user client doesn't ask for the right permissions
func UpdateUserStatus(ctx context.Context, client github.GitHubBaseClient, store storage.Storage, user models.User, classroom models.Classroom) (models.ClassroomUser, error) {
	classroomUser, err := store.GetUserInClassroom(ctx, classroom.ID, *user.ID)
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
		classroomUser, err = store.ModifyUserStatus(ctx, classroom.ID, models.UserStatusNotInOrg, *user.ID)
		if err != nil {
			return models.ClassroomUser{}, errs.InternalServerError()
		}
		return classroomUser, nil
	} else if membership != nil && *membership.State == "active" { // user is in the org, set them to active
		classroomUser, err = store.ModifyUserStatus(ctx, classroom.ID, models.UserStatusActive, *user.ID)
		if err != nil {
			return models.ClassroomUser{}, errs.InternalServerError()
		}
	} else if membership != nil && *membership.State == "pending" { // user has a pending invitation, set them to invited
		classroomUser, err = store.ModifyUserStatus(ctx, classroom.ID, models.UserStatusOrgInvited, *user.ID)
		if err != nil {
			return models.ClassroomUser{}, errs.InternalServerError()
		}
	}
	return classroomUser, nil
}

// Invites a user to a classroom and attempts to accept their invitation
// This should be called on the target user's behalf
func InviteUserToClassroom(ctx context.Context, store storage.Storage, appClient github.GitHubAppClient, userClient github.GitHubUserClient, classroomID int64, classroomRole models.ClassroomRole, invitee *models.User) (string, models.Classroom, models.ClassroomUser, error) {
	// Get the classroom from the DB
	classroom, err := store.GetClassroomByID(ctx, classroomID)
	if err != nil {
		return "", models.Classroom{}, models.ClassroomUser{}, errs.InternalServerError()
	}

	classroomUser, err := store.GetUserInClassroom(ctx, classroomID, *invitee.ID)
	if err != nil {
		classroomUser, err = store.AddUserToClassroom(ctx, classroomID, string(classroomRole), models.UserStatusRequested, *invitee.ID)
		if err != nil {
			return "", models.Classroom{}, models.ClassroomUser{}, errs.InternalServerError()
		}
	}

	classroomUser, err = UpdateUserStatus(ctx, appClient, store, *invitee, classroom)
	if err != nil {
		return "", models.Classroom{}, models.ClassroomUser{}, errs.InternalServerError()
	}

	// if the user has previously been removed, put them into the requested state and exit
	if classroomUser.Status == models.UserStatusRemoved {
		classroomUser, err = store.ModifyUserStatus(ctx, classroomID, models.UserStatusRequested, *classroomUser.ID)
		if err != nil {
			return "", models.Classroom{}, models.ClassroomUser{}, errs.InternalServerError()
		}
		return "Token applied successfully, user access has been requested", classroom, classroomUser, nil
	}

	// user is already in the classroom. If their role can be upgraded, do so. Don't downgrade them.
	roleComparison := classroomUser.Role.Compare(classroomRole)
	if roleComparison < 0 {
		// Upgrade the user's role in the classroom
		classroomUser, err = store.ModifyUserRole(ctx, classroomID, string(classroomRole), *classroomUser.ID)
		if err != nil {
			return "", models.Classroom{}, models.ClassroomUser{}, errs.InternalServerError()
		}
	}

	// Invite the user to the organization
	classroomUser, err = InviteUserToOrganization(ctx, appClient, store, classroom, classroomRole, *invitee)
	if err != nil {
		return "", models.Classroom{}, models.ClassroomUser{}, errs.InternalServerError()
	}

	// Accept the pending invitation to the organization
	err = AcceptOrgInvitation(ctx, userClient, store, classroom.OrgName, classroomID, *invitee)
	if err != nil {
		return "", models.Classroom{}, models.ClassroomUser{}, errs.InternalServerError()
	}
	return "Token applied successfully", classroom, classroomUser, nil
}
