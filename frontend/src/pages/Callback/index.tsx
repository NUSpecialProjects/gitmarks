import { AuthContext } from "@/contexts/auth";
import { useContext, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./styles.css";
import { sendCode } from "@/api/auth";
import LoadingSpinner from "@/components/LoadingSpinner";

const Callback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const hasRun = useRef(false);

  const handleSuccessfulLogin = () => {
    const redirectUrl = localStorage.getItem("redirectAfterLogin");
    login(); // set the user's login status to true
    if (redirectUrl) {
      localStorage.removeItem("redirectAfterLogin");
      navigate(redirectUrl, { replace: true }); // redirect to the page that was requested before login
    } else {
      navigate("/app/organization/select", { replace: true }); // default redirect after login
    }
  };

  useEffect(() => {
    if (hasRun.current) return; // prevent multiple executions
    hasRun.current = true;

    //if code, good, else, route to home
    if (code) {
      sendCode(code)
        .then(() => {
          //Successful login. Handle redirect
          handleSuccessfulLogin();
        })
        .catch((err: Error) => {
          // Navigate back to login page with an error message attached
          navigate(
            `/?error=${encodeURIComponent(err.message)}`,
            { replace: true }
          );
        });
    } else {
      navigate("/", { replace: true });
    }
  }, []);

  return (
    <div className="callback-container">
      <LoadingSpinner />
      <p>Logging in...</p>
    </div>
  );
};

export default Callback;
