import React from "react";
import { useLocation } from "react-router-dom";
import GenericRolePage from "..";
import { ClassroomRole } from "@/types/enums";

const StudentListPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as { users: IClassroomUser[] };
  const role_type: ClassroomRole = ClassroomRole.STUDENT;
  const role_label: string = "Student";
  return (
    <GenericRolePage role_label={role_label} role_type={role_type} userList={state.users} />
  );
};

export default StudentListPage;
