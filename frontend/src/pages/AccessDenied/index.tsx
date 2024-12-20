import { useContext } from "react";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import Button from "@/components/Button";
import "./styles.css";
import { AuthContext } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";

const AccessDenied: React.FC = () => {
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="AccessDenied">
      <div className="AccessDenied__content">
        <h2>Access Denied</h2>
        <p>
          You do not have permission to view this page.
        </p>
        <p>Please contact your professor if you believe this is an error.</p>
        <Button
          variant="primary"
          href={`/app/classroom/select?org_id=${selectedClassroom?.org_id}`}
          className="AccessDenied__button"
        >
          Return to Classroom Selection
        </Button>
        <Button 
          variant="primary" 
          onClick={handleLogout}
          className="AccessDenied__button"
        >
          Logout
        </Button>
      </div>
    </div>
  );
};

export default AccessDenied;
