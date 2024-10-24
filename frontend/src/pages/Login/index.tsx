import { FiGithub, FiX } from "react-icons/fi";
import "./styles.css";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useContext, useEffect, useMemo, useState } from "react";
import ErrorMessage from "@/components/Error";
import { AuthContext } from "@/contexts/auth";

const Login: React.FC = () => {
  const { isLoggedIn } = useContext(AuthContext);

  const clientId: string = import.meta.env.VITE_GITHUB_CLIENT_ID as string;
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const errorFromQuery = queryParams.get("error");
  const [error, setError] = useState<string | null>(errorFromQuery);

  useEffect(() => {
    if (errorFromQuery) {
      queryParams.delete("error");
      setError(errorFromQuery);
      navigate({ search: queryParams.toString() }, { replace: true });
    }
  }, [errorFromQuery, navigate, queryParams]);

  return isLoggedIn ? (
    <Navigate to="/app/dashboard" />
  ) : (
    <div className="LandingPage">
      <div className="LogoBar">
        <FiGithub className="Icon" />
        <FiX className="Icon" />
        <img src="src/assets/icons/Northeastern_LVX.svg.png" className="Logo" />
      </div>
      <div className="LandingTitle">FonteMarks</div>
      <a
        className="SignInLink"
        href={`https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,read:org,classroom&allow_signup=false`}
      >
        Log In With GitHub
      </a>
      {error && <ErrorMessage message={error} />}
    </div>
  );
};

export default Login;
