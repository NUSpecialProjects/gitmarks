import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Provides a URL parameter.
 * 
 * @param paramName - The name of the parameter to extract.
 * @param onParamPath - The path to navigate to after extracting the parameter.
 * @returns The value of the parameter.
 */
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
