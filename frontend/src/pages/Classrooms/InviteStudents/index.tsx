import Panel from "@/components/Panel";
import Button from "@/components/Button";
import CopyLink from "@/components/CopyLink";
import { useState, useContext, useEffect } from "react";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { postClassroomToken } from "@/api/classrooms";

import "../styles.css";
import { ClassroomRole } from "@/types/enums";

const InviteStudents: React.FC = () => {
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const [link, setLink] = useState<string>("");
  const base_url: string = import.meta.env
    .VITE_PUBLIC_FRONTEND_DOMAIN as string;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCreateToken = async () => {
      if (!selectedClassroom) {
        return;
      }
      await postClassroomToken(selectedClassroom.id, ClassroomRole.STUDENT)
        .then((data: ITokenResponse) => {
          const url = `${base_url}/app/token/classroom/join?token=${data.token}`;
          setLink(url);
        })
        .catch((_) => {
          setError("Failed to generate invite URL. Please try again.");
        });
    };

    if (selectedClassroom) {
      handleCreateToken();
    }
  }, [selectedClassroom]);

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
          <CopyLink link={link} name="invite-students"></CopyLink>
          {error && <p className="error">{error}</p>}
        </div>
        <div className="ButtonWrapper">
          <Button href="/app/classroom/success">Continue</Button>
        </div>
      </div>
    </Panel>
  );
};

export default InviteStudents;
