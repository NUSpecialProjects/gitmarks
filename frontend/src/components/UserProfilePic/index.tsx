import React from "react";
import "./styles.css";
import { useCurrentUser } from "@/hooks/useCurrentUser";



const UserProfilePic: React.FC = () => {
  const { data: user } = useCurrentUser();

  return (
    <div className="User">
      {user ? (
        <img src={user.github_user.avatar_url} alt={user.github_user.login} className="User__avatar" />
      ) : (
        <div className="User__avatar"> </div>
      )}
    </div>
  );
};

export default UserProfilePic;
