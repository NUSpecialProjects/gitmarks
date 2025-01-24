import { sendOrganizationInviteToUser, revokeOrganizationInvite, removeUserFromClassroom, postClassroomToken, getClassroomUsers } from "@/api/classrooms";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { ClassroomRole, ClassroomUserStatus } from "@/types/enums";
import React, { useContext, useState } from "react";
import SubPageHeader from "@/components/PageHeader/SubPageHeader";
import { Table, TableCell, TableRow } from "@/components/Table";
import EmptyDataBanner from "@/components/EmptyDataBanner";
import './styles.css';
import Button from "@/components/Button";
import CopyLink from "@/components/CopyLink";
import Pill from "@/components/Pill";
import { removeUnderscores } from "@/utils/text";
import { useClassroomUser, useClassroomUsersList } from "@/hooks/useClassroomUser";
import { useQueryClient } from "@tanstack/react-query";
import { useClassroomInviteLink } from "@/hooks/useClassroomInviteLink";

interface GenericRolePageProps {
  role_label: string;
  role_type: ClassroomRole;
}

const GenericRolePage: React.FC<GenericRolePageProps> = ({
  role_label,
  role_type,
}: GenericRolePageProps) => {
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const { classroomUser: currentClassroomUser } = useClassroomUser(selectedClassroom?.id, ClassroomRole.TA, "/access-denied");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { classroomUsers: users, error: classroomUsersError } = useClassroomUsersList(selectedClassroom?.id);
  const { data: inviteLink = "", error: classroomTokenError } = useClassroomInviteLink(selectedClassroom?.id, role_type, currentClassroomUser?.classroom_role === ClassroomRole.PROFESSOR);

  const removeUserFromList = (userId: number) => {
    queryClient.setQueryData(
      ['classroomUsers', selectedClassroom?.id, role_type],
      (oldData: IClassroomUser[] = []) => oldData.filter(user => user.id !== userId)
    );
  };

  const addUserToList = (user: IClassroomUser) => {
    queryClient.setQueryData(
      ['classroomUsers', selectedClassroom?.id, role_type],
      (oldData: IClassroomUser[] = []) => [...oldData, user]
    );
  };

  const handleInviteUser = async (userId: number) => {
    try {
      const { user } = await sendOrganizationInviteToUser(selectedClassroom!.id, role_type, userId);
      removeUserFromList(userId);
      addUserToList(user);
      setError(null);
    } catch (err) {
      setError("Failed to invite user. Please try again.");
    }
  };

  const handleRevokeInvite = async (userId: number) => {
    try {
      await revokeOrganizationInvite(selectedClassroom!.id, userId);
      removeUserFromList(userId);
      setError(null);
    } catch (err) {
      setError("Failed to revoke invite. Please try again.");
    }
  };

  const handleRemoveUser = async (userId: number) => {
    if (userId === currentClassroomUser?.id) {
      setError("You cannot remove yourself from the classroom.");
      return;
    }

    try {
      await removeUserFromClassroom(selectedClassroom!.id, userId);
      removeUserFromList(userId);
      setError(null);
    } catch (err) {
      setError("Failed to remove user. Please try again.");
    }
  };

  // Don't show buttons if (the current user is a professor) AND (the current user is not the target user)
  function shouldShowActionButtons(user: IClassroomUser) {
    return currentClassroomUser?.classroom_role === ClassroomRole.PROFESSOR && currentClassroomUser?.id !== user.id;
  }

  const showActionsColumn = users.some(user => shouldShowActionButtons(user));
  const showDisabledButtons = showActionsColumn && !users.every(user => shouldShowActionButtons(user));

  const getActionButton = (user: IClassroomUser) => {
    const shouldShowButton = shouldShowActionButtons(user)
    if (!shouldShowButton && !showDisabledButtons) {
      return null;
    }

    switch (user.status) {
      case ClassroomUserStatus.ACTIVE:
        return <Button variant={!shouldShowButton && showDisabledButtons ? "disabled" : "warning-secondary"} size="small" onClick={() => handleRemoveUser(user.id)}>Remove User</Button>;
      case ClassroomUserStatus.ORG_INVITED:
        return <Button variant={!shouldShowButton && showDisabledButtons ? "disabled" : "warning-secondary"} size="small" onClick={() => handleRevokeInvite(user.id)}>Revoke Invitation</Button>;
      case ClassroomUserStatus.REQUESTED:
      case ClassroomUserStatus.NOT_IN_ORG:
        return <Button variant="secondary" size="small" onClick={() => handleInviteUser(user.id)}>Invite User</Button>;
      default:
        return null;
    }
  };

  const filteredUsers = users.filter(user => user.classroom_role === role_type);

  return (
    <div>
      <SubPageHeader pageTitle={role_label + `s`} chevronLink="/app/dashboard/"></SubPageHeader>
      
      {inviteLink && (
        <div className="Users__inviteLinkWrapper">
          <div>
            <h2>Invite {role_label + `s`}</h2>
            <p>Share this link to invite and add students to {selectedClassroom?.name}.</p>
            {(role_type === ClassroomRole.PROFESSOR || role_type === ClassroomRole.TA) &&
              <p>Warning: This will make them an admin of the organization.</p>}
          </div>
          <CopyLink link={inviteLink} name="invite-link"></CopyLink>
        </div>
      )}

      {classroomUsersError && (
        <div className="error">
          Failed to load users. Please try again.
        </div>
      )}

      {classroomTokenError && (
        <div className="error">
          Failed to generate invite link. Please try again.
        </div>
      )}

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <div className="Users__tableWrapper">
        {filteredUsers.length > 0 ? (
          <Table cols={showActionsColumn ? 3 : 2}>
            <TableRow style={{ borderTop: "none" }}>
              <TableCell>{role_label} Name</TableCell>
              <TableCell className="Users__centerAlignedCell">Status</TableCell>
              {showActionsColumn && <TableCell className="Users__centerAlignedCell">Actions</TableCell>}
            </TableRow>
            {filteredUsers.map((user, i) => (
                <TableRow key={i}>
                  <TableCell>{user.first_name} {user.last_name}</TableCell>
                  <TableCell>
                    <Pill label={removeUnderscores(user.status)}
                      variant={(() => {
                        switch (user.status) {
                          case ClassroomUserStatus.ACTIVE:
                            return 'green';
                          case ClassroomUserStatus.ORG_INVITED:
                            return 'amber';
                          case ClassroomUserStatus.REQUESTED:
                            return 'default';
                          case ClassroomUserStatus.NOT_IN_ORG:
                            return 'red';
                          default:
                            return 'default';
                        }
                      })()}>
                    </Pill>
                  </TableCell>
                  {showActionsColumn && <TableCell>{getActionButton(user)}</TableCell>}
                </TableRow>
              ))}
          </Table>
        ) : (
          <EmptyDataBanner>
            <p>There are currently no {role_label}s in this classroom.</p>
          </EmptyDataBanner>
        )}
      </div>
    </div>
  );
};

export default GenericRolePage;
