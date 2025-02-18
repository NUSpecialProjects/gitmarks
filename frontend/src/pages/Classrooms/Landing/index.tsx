import Panel from "@/components/Panel";
import "./styles.css";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { useContext } from "react";
import { useClassroomUser } from "@/hooks/useClassroomUser";
import { ClassroomRole, ClassroomUserStatus } from "@/types/enums";

const Landing = () => {

  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const { classroomUser } = useClassroomUser(ClassroomRole.STUDENT );


  let titlePrefix = '';

  switch (classroomUser?.status) {
    case ClassroomUserStatus.REQUESTED:
      titlePrefix = 'Requested to join';
      break;
    case ClassroomUserStatus.ACTIVE:
      titlePrefix = 'Successfully joined';
      break;
    case ClassroomUserStatus.ORG_INVITED:
      titlePrefix = 'Invited to join';
      break;
    case ClassroomUserStatus.REMOVED:
      titlePrefix = "You have been removed from"
      break;
    default:
      titlePrefix = 'Status unknown';
      break;
  }

  return (
    <Panel title={`${titlePrefix} ${selectedClassroom?.org_name} - ${selectedClassroom?.name}`}>
      <p>You may now close this page.</p>
    </Panel>
  );
};

export default Landing;
