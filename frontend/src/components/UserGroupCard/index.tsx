import { useQueries } from '@tanstack/react-query';
import React from "react";
import "./styles.css";
import { fetchUser } from "@/api/users";

interface IUserGroupCardProps {
  label: string;
  givenUsersList: IClassroomUser[];
  onClick?: () => void;
}

const UserGroupCard: React.FC<IUserGroupCardProps> = ({
  label,
  givenUsersList,
  onClick,
}) => {
  const userQueries = useQueries({
    queries: givenUsersList.map((classroomUser) => ({
      queryKey: ['user', classroomUser.github_username],
      queryFn: () => fetchUser(classroomUser.github_username),
      staleTime: 1000 * 60 * 60, // 1 hour
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    }))
  });

  let userIcons: React.ReactNode[] = [];
  const MAX_USERS_TO_SHOW = 3;

  if (givenUsersList && givenUsersList.length > 0) {
    const usersToShow = givenUsersList.slice(0, MAX_USERS_TO_SHOW);
    userIcons = usersToShow.map((_, index) => {
      const userQuery = userQueries[index];
      const githubUser = userQuery.data?.github_user;

      const showPlaceholder = userQuery.isLoading || !userQuery.data || !githubUser;

      return (
        <div key={index}>
          {showPlaceholder ? (
            <div className="UserGroupCard__icon-placeholder" />
          ) : (
            <img
              className={`UserGroupCard__icon ${index > 0 ? "UserGroupCard__icon-overlap" : ""}`}
              src={githubUser.avatar_url}
              alt={`${githubUser.login}'s avatar`}
            />
          )}
        </div>
      );
    });
  }

  return (
    <div className="UserGroupCard" onClick={() => onClick && onClick()}>
      <div className="UserGroupCard__content">
        <h3 className="UserGroupCard__label">{label}</h3>
        <div className="UserGroupCard__detailsWrapper">
          <div className="UserGroupCard__icons">{userIcons}</div>
          <p className="UserGroupCard__number">{givenUsersList.length}</p>
        </div>
      </div>
    </div>
  );
};

export default UserGroupCard;
