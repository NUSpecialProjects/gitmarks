import { ClassroomRole, ClassroomUserStatus } from "@/types/enums";
import React, { useEffect, useState } from "react";
import SubPageHeader from "@/components/PageHeader/SubPageHeader";
import { Table, TableCell, TableRow } from "@/components/Table";
import EmptyDataBanner from "@/components/EmptyDataBanner";
import './styles.css';
import Button from "@/components/Button";
import CopyLink from "@/components/CopyLink";
import Pill from "@/components/Pill";
import { removeUnderscores } from "@/utils/text";
import { useClassroomUser, useClassroomUsersList, useCurrentClassroom, useInviteClassroomUser, useRevokeClassroomInvite, useRemoveClassroomUser } from "@/hooks/useClassroomUser";
import { useClassroomInviteLink } from "@/hooks/useClassroom";
import { ErrorToast, useActionToast } from "@/components/Toast";

interface GenericRolePageProps {
  role_label: string;
  role_type: ClassroomRole;
}

const GenericRolePage: React.FC<GenericRolePageProps> = ({
  role_label,
  role_type,
}: GenericRolePageProps) => {
  const { selectedClassroom } = useCurrentClassroom();
  const { classroomUser: currentClassroomUser } = useClassroomUser(ClassroomRole.TA, "/app/access-denied");
  const [loadingUserIds, setLoadingUserIds] = useState<Set<number>>(new Set());

  const { classroomUsers: users, error: usersError } = useClassroomUsersList(selectedClassroom?.id);
  const { data: inviteLink = "", error: inviteLinkError } = useClassroomInviteLink(selectedClassroom?.id, role_type, currentClassroomUser?.classroom_role === ClassroomRole.PROFESSOR);
  const { inviteUser } = useInviteClassroomUser(selectedClassroom?.id);
  const { revokeInvite } = useRevokeClassroomInvite(selectedClassroom?.id);
  const { removeUser } = useRemoveClassroomUser(selectedClassroom?.id, currentClassroomUser?.id);

  const { executeWithToast } = useActionToast();

  const handleInviteUser = (userId: number) => {
    executeWithToast(
      `invite-${userId}`,
      async () => {
        await inviteUser(userId, role_type, setLoadingUserIds);
      }, {
        pending: `Inviting ${role_label.toLowerCase()}...`,
        success: `Successfully invited ${role_label.toLowerCase()}`,
        error: `Failed to invite ${role_label.toLowerCase()}. Please try again.`
      }
    );
  };
  
  const handleRevokeInvite = (userId: number) => {
    executeWithToast(
      `revoke-invite-${userId}`,
      async () => await revokeInvite(userId, setLoadingUserIds),
      {
        pending: `Revoking ${role_label.toLowerCase()} invitation...`,
        success: `Successfully revoked ${role_label.toLowerCase()} invitation`,
        error: `Failed to revoke ${role_label.toLowerCase()} invitation. Please try again.`
      }
    );
  };

  const handleRemoveUser = (userId: number) => {
    executeWithToast(
      `remove-user-${userId}`,
      async () => await removeUser(userId, setLoadingUserIds),
      {
        pending: `Removing ${role_label.toLowerCase()}...`,
        success: `Successfully removed ${role_label.toLowerCase()}`,
        error: `Failed to remove ${role_label.toLowerCase()}. Please try again.`
      }
    );
  };

  useEffect(() => {
    if (usersError) {
      ErrorToast(usersError?.message || 'An unexpected error occurred', "users-error");
    }
  }, [usersError]);

  useEffect(() => {
    if (inviteLinkError) {
      ErrorToast(inviteLinkError?.message || 'An unexpected error occurred', "invite-link-error");
    }
  }, [inviteLinkError]);


  const showActionsColumn = currentClassroomUser?.classroom_role === ClassroomRole.PROFESSOR

  const getActionButton = (user: IClassroomUser) => {
    const isDisabled = loadingUserIds.has(user.id) || currentClassroomUser?.id === user.id;
  
    switch (user.status) {
      case ClassroomUserStatus.ACTIVE:
        return <Button 
          variant={"warning-secondary"} 
          size="small" 
          onClick={() => handleRemoveUser(user.id)}
          disabled={isDisabled}
        >{"Remove User"}</Button>;
      case ClassroomUserStatus.ORG_INVITED:
        return <Button 
          variant={"warning-secondary"} 
          size="small" 
          onClick={() => handleRevokeInvite(user.id)}
          disabled={isDisabled}
        >{"Revoke Invitation"}</Button>;
      case ClassroomUserStatus.REQUESTED:
      case ClassroomUserStatus.NOT_IN_ORG:
        return <Button 
          variant={"secondary"}
          size="small" 
          onClick={() => handleInviteUser(user.id)}
          disabled={isDisabled}
        >{"Invite User"}</Button>;
      default:
        return null;
    }
  };

  const filteredUsers = users.filter(user => user.classroom_role === role_type && user.status != ClassroomUserStatus.REMOVED);

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
