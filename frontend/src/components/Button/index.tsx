import { Link } from "react-router-dom";
import "./styles.css";
interface IButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?:
    | "primary"
    | "secondary"
    | "warning-primary"
    | "warning-secondary"
    | "disabled";
  size?: "default" | "small";
  newTab?: boolean;
  state?: object;
}
const ButtonWrapper: React.FC<IButtonProps> = ({
  children,
  href,
  newTab = false,
  state,
}) => {
  return href ? (
    <Link to={href} target={newTab ? "_blank" : "_self"} state={state}>
      {children}
    </Link>
  ) : (
    <>{children}</>
  );
};
const Button: React.FC<IButtonProps> = ({
  className,
  children,
  href,
  variant = "primary",
  size = "default",
  newTab,
  state,
  ...props
}) => {
  return (
    <ButtonWrapper href={href} newTab={newTab} state={state}>
      <button
        disabled={variant == "disabled"}
        className={`Button Button--${variant} Button--${size} ${className ?? ""}`}
        {...props}
      >
        {children}
      </button>
    </ButtonWrapper>
  );
};
export default Button;
