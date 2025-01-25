import Panel from "@/components/Panel";
import Button from "@/components/Button";
import CopyLink from "@/components/CopyLink";
import { useContext } from "react";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import "../styles.css";
import { ClassroomRole } from "@/types/enums";
import { useClassroomInviteLink } from "@/hooks/useClassroom";

const InviteTAs: React.FC = () => {
  const { selectedClassroom } = useContext(SelectedClassroomContext);

  const { data: tokenData, error } = useClassroomInviteLink(selectedClassroom?.id, ClassroomRole.TA);

  return (
    <Panel title="Add Teaching Assistants" logo={true}>
      <div className="Invite">
        <div className="Invite__ContentWrapper">
          <div className="Invite__TextWrapper">
            <h2>Use the link below to invite TAs to your Classroom</h2>
            <div>
              {"To add TA's to your classroom, invite them using this link!"}
            </div>
          </div>
          <CopyLink link={tokenData || ""} name="invite-tas"></CopyLink>
          {error && <p className="error">Failed to generate invite URL. Please try again.</p>}
        </div>
        <div className="ButtonWrapper">
          <Button href="/app/classroom/invite-students">Continue</Button>
        </div>
      </div>
    </Panel>
  );
};

export default InviteTAs;
