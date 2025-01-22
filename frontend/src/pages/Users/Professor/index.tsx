import React from "react";
import GenericRolePage from "..";
import { ClassroomRole } from "@/types/enums";

const ProfessorListPage: React.FC = () => {
  const role_type: ClassroomRole = ClassroomRole.PROFESSOR;
  const role_label: string = "Professor";
  return (
    <GenericRolePage role_label={role_label} role_type={role_type}/>
  );
};

export default ProfessorListPage;
