import React from "react";
import GenericRolePage from "..";
import { ClassroomRole } from "@/types/enums";

const TAListPage: React.FC = () => {
  const role_type: ClassroomRole = ClassroomRole.TA;
  const role_label: string = "Teaching Assistant";
  return (
    <GenericRolePage role_label={role_label} role_type={role_type}/>
  );
};

export default TAListPage;
