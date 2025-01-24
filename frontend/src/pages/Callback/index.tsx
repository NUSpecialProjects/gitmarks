import { useContext, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./styles.css";
import { sendCode } from "@/api/auth";
import LoadingSpinner from "@/components/LoadingSpinner";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { AuthState, getRedirectUrl, goToRedirectUrl, useAuth } from "@/contexts/auth";
// import { goToRedirectUrlOrDefault } from "@/contexts/auth";

const Callback: React.FC = () => {
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const { authState, refetch } = useAuth();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const navigate = useNavigate();
  const hasRun = useRef(false);
  const authStateRef = useRef(authState);

  useEffect(() => { // Keep the ref up to date with the latest authState for timeout function
    authStateRef.current = authState;
  }, [authState]);

  useEffect(() => {
    if (authState === AuthState.LOGGED_IN) {
      if (getRedirectUrl()) {
        goToRedirectUrl(navigate);
      } else if (selectedClassroom) {
        navigate(`/app/dashboard`);
      } else {
        navigate("/app/organization/select");
      }
    }
  }, [authState]);

  useEffect(() => {
    if (hasRun.current) return; // prevent multiple executions
    hasRun.current = true;

    // if code, good, else, route to home
    if (!code) {
      navigate(`/?error=${encodeURIComponent("No login code provided")}`, { replace: true });
      return;
    }

    sendCode(code)
      .then(() => {
        refetch();
      })
      .catch((err: Error) => {
        navigate(
          `/?error=${encodeURIComponent(err.message)}`,
          { replace: true }
        );
      });
  }, [code]);

  return (
    <div className="callback-container">
      <LoadingSpinner />
      <p>Logging in...</p>
    </div>
  );
};

export default Callback;
