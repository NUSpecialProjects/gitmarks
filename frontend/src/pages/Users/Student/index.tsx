import React from "react";
import { useLocation } from "react-router-dom";
import GenericRolePage from "..";

const StudentListPage: React.FC = () => {

  const location = useLocation();
  const state = location.state as { users: IClassroomUser[] };
  const role_type = "STUDENT";
  const role_label = "Student";
  return (
    <>
      <GenericRolePage role_label={role_label} role_type={role_type} userList={state.users} />
    </>
  );
};

export default StudentListPage;
