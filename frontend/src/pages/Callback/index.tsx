import { AuthContext } from "@/contexts/auth";
import { useContext, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ClipLoader from "react-spinners/ClipLoader";
import "./styles.css";

const Callback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    //if code, good, else, route to home
    if (code) {
      const sendCode = () => {
        const base_url: string = import.meta.env
          .VITE_PUBLIC_API_DOMAIN as string;
        fetch(`${base_url}/login`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        })
          .then((response) => {
            if (!response.ok) {
              // Navigate back to login page
              navigate("/");
              return;
            } else {
              //Successful login. Navigate to dashboard page and call login
              login();
              navigate("/app/classroom/create");
            }
          })
          .catch((err: unknown) => {
            // Navigate back to login page with an error message attached
            navigate(
              `/?error=${encodeURIComponent("An error occurred while logging in. Please try again.")}`
            );
            console.log("Error Occurred: ", err);
            return;
          });
      };
      sendCode();
    } else {
      navigate("/");
    }
  });

  return (
    <div className="callback-container">
      <ClipLoader size={50} color={"#123abc"} loading={true} />
      <p>Logging in...</p>
    </div>
  );
};

export default Callback;
