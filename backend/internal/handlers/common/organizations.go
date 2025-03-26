package common

import (
	"context"

	"github.com/CamPlume1/khoury-classroom/internal/errs"
	"github.com/CamPlume1/khoury-classroom/internal/github"
	"github.com/CamPlume1/khoury-classroom/internal/models"
	"github.com/CamPlume1/khoury-classroom/internal/storage"
)

// Helper function to invite a user to the organization (delegates based on the role supplied)
func InviteUserToOrganization(ctx context.Context, client github.GitHubBaseClient, store storage.Storage, classroom models.Classroom, classroomRole models.ClassroomRole, user models.User) (models.ClassroomUser, error) {
	var classroomUser models.ClassroomUser
	var err error
	if classroomRole == models.Student {
		// Get the team ID
		studentTeam, err := client.GetTeamByName(ctx, classroom.OrgName, *classroom.StudentTeamName)
		if err != nil {
			return models.ClassroomUser{}, errs.InternalServerError()
		}

		// Invite the user to the organization
		classroomUser, err = inviteMemberToOrganization(ctx, client, store, *studentTeam.ID, classroom.ID, user)
		if err != nil {
			return models.ClassroomUser{}, errs.InternalServerError()
		}
	} else {
		// Invite the user to the organization
		classroomUser, err = inviteAdminToOrganization(ctx, client, store, classroom.OrgName, classroom.ID, user)
		if err != nil {
			return models.ClassroomUser{}, errs.InternalServerError()
		}
	}

	return classroomUser, nil
}

// Helper function to invite a student to the organization (adds them to the student team as well on acceptance)
func inviteMemberToOrganization(context context.Context, client github.GitHubBaseClient, store storage.Storage, teamID int64, classroomID int64, invitee models.User) (models.ClassroomUser, error) {
	err := client.AddTeamMember(context, teamID, invitee.GithubUsername, nil)
	if err != nil {
		return models.ClassroomUser{}, errs.InternalServerError()
	}
	classroomUser, err := store.ModifyUserStatus(context, classroomID, models.UserStatusOrgInvited, *invitee.ID)
	if err != nil {
		return models.ClassroomUser{}, errs.InternalServerError()
	}

	return classroomUser, nil
}

// Helper function to invite an admin to the organization
func inviteAdminToOrganization(context context.Context, client github.GitHubBaseClient, store storage.Storage, orgName string, classroomID int64, invitee models.User) (models.ClassroomUser, error) {
	err := client.SetUserMembershipInOrg(context, orgName, invitee.GithubUsername, "admin")
	if err != nil {
		return models.ClassroomUser{}, errs.InternalServerError()
	}
	classroomUser, err := store.ModifyUserStatus(context, classroomID, models.UserStatusOrgInvited, *invitee.ID)
	if err != nil {
		return models.ClassroomUser{}, errs.InternalServerError()
	}
	return classroomUser, nil
}

// Helper function to accept a pending invitation to an organization (Assumes there is a pending invitation)
func AcceptOrgInvitation(context context.Context, userClient github.GitHubUserClient, store storage.Storage, orgName string, classroomID int64, invitee models.User) error {
	// user has a pending invitation, accept it
	err := userClient.AcceptOrgInvitation(context, orgName)
	if err != nil {
		return errs.InternalServerError()
	}
	_, err = store.ModifyUserStatus(context, classroomID, models.UserStatusActive, *invitee.ID)
	if err != nil {
		return errs.InternalServerError()
	}

	return nil
}
