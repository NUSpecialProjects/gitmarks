import React from "react";
import GenericRolePage from "..";
import { ClassroomRole } from "@/types/enums";

const StudentListPage: React.FC = () => {
  const   role_type: ClassroomRole = ClassroomRole.STUDENT;
  const role_label: string = "Student";
  return (
    <GenericRolePage role_label={role_label} role_type={role_type}/>
  );
};

export default StudentListPage;
