import React from "react";
import { useNavigate } from "react-router-dom";
import { useClassroomToken } from "@/api/classrooms";
import TokenApplyPage from "../Generic";
import { ClassroomRole } from "@/types/enums";
import { useCurrentClassroom } from "@/hooks/useClassroomUser";

const ClassroomTokenApply: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedClassroom } = useCurrentClassroom();

  const handleSuccess = (data: IClassroomJoinResponse) => {
    console.log("data??", data)
    if (data) {
      console.log(data.classroom_user.classroom_role)
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