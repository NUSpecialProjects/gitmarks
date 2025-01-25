import Button from "@/components/Button";
import "./styles.css";
import { useAuth } from "@/contexts/auth";
import { Navigate, useNavigate } from "react-router-dom";
import { useClassroomUser, useCurrentClassroom } from "@/hooks/useClassroomUser";
import { ClassroomRole, ClassroomUserStatus } from "@/types/enums";

const AccessDenied: React.FC = () => {
  const { selectedClassroom, loading: classroomLoading } = useCurrentClassroom();
  const { classroomUser, error: classroomUserError } = useClassroomUser();
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
        {classroomUser?.status === ClassroomUserStatus.ACTIVE && classroomUser?.classroom_role !== ClassroomRole.STUDENT ? (
          <Navigate to={`/app/dashboard`} />  
        ) : classroomUser?.status === ClassroomUserStatus.ORG_INVITED ? (
          <>
            <p>You have a pending invitation.</p>
            <p>Please accept the invitation to access this page:</p>
              <Button
                variant="primary"
                href={`https://github.com/orgs/${selectedClassroom?.org_name}/invitation`}
                newTab={true}
                className="AccessDenied__button"
                disabled={classroomLoading}
              >
                View Invitation on GitHub
              </Button>
          </>
        ) : (
          <>
            {classroomUser?.status === ClassroomUserStatus.REMOVED ? (
              <>
                <h4>Insufficient Permissions:</h4>
                <p>You have been removed from this classroom.</p>
                <p>Please contact your professor if you believe this is an error.</p>
              </>
            ) : classroomUser?.status === ClassroomUserStatus.NOT_IN_ORG ? (
              <>
                <h4>Insufficient Permissions:</h4>
                <p>You are not in the GitHub organization.</p>
                <p>Please contact your professor if you believe this is an error.</p>
              </>
            ) : classroomUser?.status === ClassroomUserStatus.REQUESTED ? (
              <>
                <h4>Insufficient Permissions:</h4>
                <p>You have requested to join this classroom.</p>
                <p>Please contact your professor if you believe this is an error.</p>
              </>
            ) : classroomUser?.classroom_role === ClassroomRole.STUDENT ? (
              <>
                <h4>Insufficient Permissions:</h4>
                <p>You are not an administrator in this classroom.</p>
                <p>Please contact your professor if you believe this is an error.</p>
              </>
            ) : classroomUserError ? (
              <>
                <h4>Unexpected Error: {classroomUserError.message}</h4>
                <p>An error occurred while loading your classroom.</p>
              </>
            ) : (
              <>
                <h4>Unexpected Error:</h4>
                <p>We were unable to verify your classroom access.</p>
                <p>Please try again later.</p>
              </>
            )}
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
