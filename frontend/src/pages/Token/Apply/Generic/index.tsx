import LoadingSpinner from "@/components/LoadingSpinner";
import useUrlParameter from "@/hooks/useUrlParameter";
import { useEffect, useState } from "react";

export interface TokenHandlerConfig<T extends ITokenUseResponse> {
        useTokenFunction: (token: string) => Promise<T>;
        successCallback: (response: T) => void;
        loadingMessage?: string;
        successMessage?: (response: T) => string;
  }
  
  const TokenApplyPage = <T extends ITokenUseResponse>({
    useTokenFunction = async () => {throw new Error("useTokenFunction not implemented")},
    successCallback = () => {throw new Error("successCallback not implemented")},
    loadingMessage = "Applying token...",
    successMessage = () => "Success! Redirecting...",
}: TokenHandlerConfig<T>) => {
    const inputToken = useUrlParameter("token");
    const [message, setMessage] = useState<string>("Loading...");
    const [loading, setLoading] = useState<boolean>(true);
    const [success, setSuccess] = useState<boolean>(false);
  
    useEffect(() => {
      if (inputToken && !success) {
        handleUseToken();
      }
    }, [inputToken]);
  
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
        <>
          {loading && <LoadingSpinner />} 
          <p>{message}</p>
        </>
    );
  };
  
  export default TokenApplyPage;