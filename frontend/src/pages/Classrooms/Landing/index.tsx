import Panel from "@/components/Panel";
import "./styles.css";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { useContext } from "react";
import { useClassroomUser } from "@/hooks/useClassroomUser";
import { ClassroomRole, ClassroomUserStatus } from "@/types/enums";

const Landing = () => {

  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const { classroomUser } = useClassroomUser(selectedClassroom?.id, ClassroomRole.STUDENT );

  return (
    <Panel title={`${classroomUser?.status === ClassroomUserStatus.REQUESTED ?  "Requested to join" : "Successfully joined"} ${selectedClassroom?.org_name} - ${selectedClassroom?.name}`}>
      <p>You may now close this page.</p>
    </Panel>
  );
};

export default Landing;
