import { sendOrganizationInvitesToRequestedUsers, sendOrganizationInviteToUser, revokeOrganizationInvite, removeUserFromClassroom, postClassroomToken, getClassroomUsers } from "@/api/classrooms";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { ClassroomRole, ClassroomUserStatus } from "@/types/enums";
import React, { useContext, useEffect, useState } from "react";
import SubPageHeader from "@/components/PageHeader/SubPageHeader";
import { Table, TableCell, TableRow } from "@/components/Table";
import EmptyDataBanner from "@/components/EmptyDataBanner";
import './styles.css';
import Button from "@/components/Button";
import CopyLink from "@/components/CopyLink";
import Pill from "@/components/Pill";
import { removeUnderscores } from "@/utils/text";
import { useClassroomUser } from "@/hooks/useClassroomUser";

interface GenericRolePageProps {
  role_label: string;
  role_type: ClassroomRole;
  userList: IClassroomUser[];
}

const GenericRolePage: React.FC<GenericRolePageProps> = ({
  role_label,
  role_type,
  userList: initialUserList,
}: GenericRolePageProps) => {
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const { classroomUser: currentClassroomUser } = useClassroomUser(selectedClassroom?.id, ClassroomRole.TA, "/access-denied");
  const base_url: string = import.meta.env.VITE_PUBLIC_FRONTEND_DOMAIN as string;
  const [link, setLink] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<IClassroomUser[]>(initialUserList);

  const removeUserFromList = (userId: number) => {
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
  };

  const addUserToList = (user: IClassroomUser) => {
    setUsers(prevUsers => [...prevUsers, user]);
  };

  const handleInviteAll = async () => {
    await sendOrganizationInvitesToRequestedUsers(selectedClassroom!.id, role_type)
      .then((data: IClassroomInvitedUsersListResponse) => {
        setUsers([...data.invited_users, ...data.requested_users]);
      })
      .catch((_) => {
        setError("Failed to invite all users. Please try again.");
      });
  };

  const handleInviteUser = async (userId: number) => {
    await sendOrganizationInviteToUser(selectedClassroom!.id, role_type, userId)
      .then((data: IClassroomUserResponse) => {
        removeUserFromList(userId);
        addUserToList(data.user);
      })
      .catch((_) => {
        setError("Failed to invite user. Please try again.");
      });
  };

  const handleRevokeInvite = async (userId: number) => {
    await revokeOrganizationInvite(selectedClassroom!.id, userId)
      .then((_) => {
        removeUserFromList(userId);
      })
      .catch((_) => {
        setError("Failed to revoke invite. Please try again.");
      });
  };

  const handleRemoveUser = async (userId: number) => {
    if (userId === currentClassroomUser?.id) {
      setError("You cannot remove yourself from the classroom.");
      return;
    }
    await removeUserFromClassroom(selectedClassroom!.id, userId)
      .then(() => {
        removeUserFromList(userId);
      })
      .catch((_) => {
        setError("Failed to remove user. Please try again.");
      });
  };

  useEffect(() => {
    const handleRefresh = async () => {
      if (!selectedClassroom) {
        setError(null);
        return;
      }

      try {
        const users = await getClassroomUsers(selectedClassroom.id);
        setUsers(users.filter((user: IClassroomUser) => user.classroom_role === role_type));
        setError(null);
      } catch (_) {
        setError("Failed to update classroom users");
      }
    };

    handleRefresh();
  }, [selectedClassroom]);

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

  useEffect(() => {
    const handleCreateToken = async () => {
      if (!selectedClassroom) {
        return;
      }
      await postClassroomToken(selectedClassroom.id, role_type)
        .then((data: ITokenResponse) => {
          const url = `${base_url}/app/token/classroom/join?token=${data.token}`;
          setLink(url);
        })
        .catch((_) => {
          setError("Failed to generate invite URL. Please try again.");
        });
    };

    if (selectedClassroom) {
      handleCreateToken();
    }
  }, [selectedClassroom, showActionsColumn])

  return (
    <div>
      <SubPageHeader pageTitle={role_label + `s`} chevronLink="/app/dashboard/"></SubPageHeader>
      {link && (
        <div className="Users__inviteLinkWrapper">
          <div>
            <h2>Invite {role_label + `s`}</h2>
            <p>Share this link to invite and add students to {selectedClassroom?.name}.</p>
            {(role_type === ClassroomRole.PROFESSOR || role_type === ClassroomRole.TA) &&
              <p>Warning: This will make them an admin of the organization.</p>}
            {error && <p className="error">{error}</p>}
          </div>
          <CopyLink link={link} name="invite-link"></CopyLink>

          {users.filter(user => (user.status === ClassroomUserStatus.REQUESTED && shouldShowActionButtons(user))).length > 0 && (
            <div className="Users__inviteAllWrapper">
              <Button onClick={handleInviteAll}>Invite All Requested Users</Button>
            </div>
          )}
        </div>
      )}

      <div className="Users__tableWrapper">
        {users.length > 0 ? (
          <Table cols={showActionsColumn ? 3 : 2}>
            <TableRow style={{ borderTop: "none" }}>
              <TableCell>{role_label} Name</TableCell>
              <TableCell className="Users__centerAlignedCell">Status</TableCell>
              {showActionsColumn && <TableCell className="Users__centerAlignedCell">Actions</TableCell>}
            </TableRow>
            {users.map((user, i) => (
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
                          return 'default'; // Fallback for unexpected roles
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
