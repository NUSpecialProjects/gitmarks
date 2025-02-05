import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./styles.css";
import LoadingSpinner from "@/components/LoadingSpinner";
import { AuthState, getRedirectUrl, goToRedirectUrl, useAuth } from "@/contexts/auth";
import { useAuthCallback } from "@/hooks/useCallbackURL";

const Callback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const navigate = useNavigate();
  const { authState, refetch } = useAuth();

  const isLoading = useAuthCallback(code, () => {
    refetch();
  }, (err: Error) => {
    navigate(`/?error=${encodeURIComponent(err.message)}`, { replace: true });
  });

  useEffect(() => {
    if (isLoading) return;
    if (authState === AuthState.LOGGED_IN) {
      if (getRedirectUrl()) {
        goToRedirectUrl(navigate);
      } else {
        navigate(`/app/dashboard`);
      }
    }
  }, [authState, isLoading]);

  return (
    <div className="callback-container">
      <LoadingSpinner />
      <p>Logging in...</p>
    </div>
  );
};

export default Callback;
