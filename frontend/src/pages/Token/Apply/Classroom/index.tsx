import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useClassroomToken } from "@/api/classrooms";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import TokenApplyPage from "../Generic";
import { ClassroomRole } from "@/types/enums";

const ClassroomTokenApply: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedClassroom } = useContext(SelectedClassroomContext);

  const handleSuccess = (data: IClassroomJoinResponse) => {
    if (data) {
      setSelectedClassroom(data.classroom);
      if (data.classroom_user.classroom_role === ClassroomRole.STUDENT) {
        navigate("/app/classroom/landing", { replace: true });
      } else {
        navigate("/app/dashboard", { replace: true });
      }
    }
  }
  
  return (
    <TokenApplyPage<IClassroomJoinResponse>
      useTokenFunction={async (token: string) => {
        return await useClassroomToken(token);
      }}
      successCallback={handleSuccess}
      loadingMessage={"Joining classroom..."}
      successMessage={(response: IClassroomJoinResponse) => response.message}
    />
  );
};

export default ClassroomTokenApply;