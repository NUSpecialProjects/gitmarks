import Panel from "@/components/Panel";
import Button from "@/components/Button";
import CopyLink from "@/components/CopyLink";
import { useContext } from "react";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { postClassroomToken } from "@/api/classrooms";
import { useQuery } from "@tanstack/react-query";

import "../styles.css";
import { ClassroomRole } from "@/types/enums";

const InviteStudents: React.FC = () => {
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const base_url: string = import.meta.env
    .VITE_PUBLIC_FRONTEND_DOMAIN as string;

  const { data: tokenData, error } = useQuery({
    queryKey: ['classroomToken', selectedClassroom?.id],
    queryFn: async () => {
      if (!selectedClassroom?.id) return null;
      const data = await postClassroomToken(selectedClassroom.id, ClassroomRole.STUDENT);
      return `${base_url}/app/token/classroom/join?token=${data.token}`;
    },
    enabled: !!selectedClassroom?.id
  });

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
