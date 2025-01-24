import { postClassroomToken } from "@/api/classrooms";
import React, { useState } from "react";

interface CreateTokenProps {
  role_type: string;
  role_label: string;
  classroom: IClassroom | null;
}

const LinkGenerator: React.FC<CreateTokenProps> = ({
  role_type,
  role_label,
  classroom,
}) => {
  const [message, setMessage] = useState<string>("");
  const [duration, setDuration] = useState<number | undefined>(10080); // Default to 7 days
  const base_url: string = import.meta.env.VITE_PUBLIC_FRONTEND_DOMAIN as string;


  const expirationOptions = [
    { label: "1 hour", value: 60 },
    { label: "6 hours", value: 360 },
    { label: "12 hours", value: 720 },
    { label: "1 day", value: 1440 },
    { label: "7 days", value: 10080 },
    { label: "Never", value: undefined },
  ];

  const handleCreateToken = async () => {
    if (!classroom) {
      setMessage("No classroom selected");
      return;
    }
    await postClassroomToken(classroom.id, role_type, duration)
      .then((data: ITokenResponse) => {
        const url = `${base_url}/token/classroom/join?token=${data.token}`;
        setMessage("Link created! " + url);
        navigator.clipboard.writeText(url);
      })
      .catch((error) => {
        setMessage("Error creating token: " + error);
      });
  };

  return (
    <div>
      <h3>Create {role_label} Invite Link</h3>
      <select
        value={duration === undefined ? "" : duration}
        onChange={(e) =>
          setDuration(
            e.target.value === "" ? 10080 : Number(e.target.value)
          )
        }
      >
        {expirationOptions.map((option) => (
          <option key={option.label} value={option.value ?? ""}>
            {option.label}
          </option>
        ))}
      </select>
      <button onClick={handleCreateToken} disabled={!classroom}>
        Generate {role_label} Link
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default LinkGenerator;
