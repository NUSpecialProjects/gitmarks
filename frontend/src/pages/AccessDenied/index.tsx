import Button from "@/components/Button";
import "./styles.css";
import { useAuth } from "@/contexts/auth";
import { Navigate, useNavigate } from "react-router-dom";
import { useClassroomUser, useCurrentClassroom } from "@/hooks/useClassroomUser";
import { ClassroomUserStatus } from "@/types/enums";

const AccessDenied: React.FC = () => {
  const { selectedClassroom } = useCurrentClassroom();
  const { classroomUser } = useClassroomUser();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="AccessDenied">
      <div className="AccessDenied__content">
        <h2>Access Denied</h2>
        {classroomUser?.status === ClassroomUserStatus.ACTIVE ? (
          <Navigate to={`/app/dashboard`} />  
        ) : classroomUser?.status === ClassroomUserStatus.ORG_INVITED ? (
          <>
            <p>You have a pending invitation.</p>
            <p>Please accept the invitation to access this page:</p>
            
              <Button
                variant="primary"
                href="https://github.com/orgs/NUSpecialProjects/invitation"
                newTab={true}
                className="AccessDenied__button"
              >
                View Invitation on GitHub
              </Button>
            
          </>
        ) : (
          <>
            <p>You do not have permission to view this page.</p>
            <p>Please contact your professor if you believe this is an error.</p>
            <Button
              variant="primary"
              href={`/app/classroom/select?org_id=${selectedClassroom?.org_id}`}
              className="AccessDenied__button"
            >
              Return to Classroom Selection
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleLogout}
              className="AccessDenied__button"
            >
              Logout
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default AccessDenied;
