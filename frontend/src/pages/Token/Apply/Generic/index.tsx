import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/auth";
import { AuthState } from "@/contexts/auth";
import { setRedirectUrl } from "@/contexts/auth";
import useUrlParameter from "@/hooks/useUrlParameter";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./styles.css";

export interface TokenHandlerConfig<T extends ITokenUseResponse> {
    useTokenFunction: (token: string) => Promise<T>;
    successCallback: (response: T) => void;
    loadingMessage?: string;
    successMessage?: (response: T) => string;
    children?: React.ReactNode;
  }
  
  const TokenApplyPage = <T extends ITokenUseResponse>({
    useTokenFunction = async () => {throw new Error("useTokenFunction not implemented")},
    successCallback = () => {throw new Error("successCallback not implemented")},
    loadingMessage = "Applying token...",
    successMessage = () => "Success! Redirecting...",
    children,
}: TokenHandlerConfig<T>) => {
    const { authState } = useAuth();
    const navigate = useNavigate();
    const inputToken = useUrlParameter("token");
    const [message, setMessage] = useState<string>(mapAuthStateToMessage(authState));
    const [loading, setLoading] = useState<boolean>(true);
    const [success, setSuccess] = useState<boolean>(false);


    function mapAuthStateToMessage(authState: AuthState): string {
      switch (authState) {
        case AuthState.LOGGED_IN:
          return loadingMessage;
        case AuthState.LOGGING_IN:
          return "Logging in...";
        case AuthState.LOGGED_OUT:
          return "Redirecting to login...";
      }
    }

    useEffect(() => {
      if (authState === AuthState.LOGGED_OUT) {
        setRedirectUrl();
        setMessage(mapAuthStateToMessage(authState));
        setTimeout(() => { // delay to allow message to be displayed
          navigate("/");
        }, 1000);
        return;
      }

      if (authState === AuthState.LOGGED_IN && inputToken && !success) {
        handleUseToken();
      }
    }, [authState, inputToken]);
  
    const handleUseToken = async () => {
      setLoading(true);
      setMessage(loadingMessage);
      await useTokenFunction(inputToken)
        .then((response) => {
          setMessage(successMessage(response));
          setSuccess(true);
          successCallback(response);
        })
        .catch((error) => {
          setMessage("Error using token: " + error);
        })
        .finally(() => {
          setLoading(false);
        });
    };
  
    return (
      <div className="token-container">
        {loading && <LoadingSpinner />} 
        {message && <p>{message}</p>}
        {children}
      </div>
    );
  };
  
  export default TokenApplyPage;