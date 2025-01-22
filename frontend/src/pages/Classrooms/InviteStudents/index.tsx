import Panel from "@/components/Panel";
import Button from "@/components/Button";
import CopyLink from "@/components/CopyLink";
import { useContext } from "react";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";

import "../styles.css";
import { ClassroomRole } from "@/types/enums";
import { useClassroomInviteLink } from "@/hooks/useClassroomInviteLink";

const InviteStudents: React.FC = () => {
  const { selectedClassroom } = useContext(SelectedClassroomContext);

  const { data: tokenData, error } = useClassroomInviteLink(selectedClassroom?.id, ClassroomRole.STUDENT);

  return (
    <Panel title="Add Students" logo={true}>
      <div className="Invite">
        <div className="Invite__ContentWrapper">
          <div className="Invite__TextWrapper">
            <h2>Use the link below to invite students</h2>
            <div>
              {
                "To add students to your classroom, invite them using this link!"
              }
            </div>
          </div>
          <CopyLink link={tokenData || ""} name="invite-students"></CopyLink>
          {error && <p className="error">Failed to generate invite URL. Please try again.</p>}
        </div>
        <div className="ButtonWrapper">
          <Button href="/app/classroom/success">Continue</Button>
        </div>
      </div>
    </Panel>
  );
};

export default InviteStudents;
