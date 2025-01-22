import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Hook to extract url parameter, then optionally navigate to a new path
const useUrlParameter = (paramName: string, onParamPath?: string) => {
  const [paramValue, setParamValue] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const param = params.get(paramName);
    if (param) {
      setParamValue(param);
      if (onParamPath) {
        navigate(onParamPath, { replace: true });
      }
    }
  }, [location.search]);

  return paramValue;
};

export default useUrlParameter;
