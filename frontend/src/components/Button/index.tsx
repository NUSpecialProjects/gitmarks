import { Link } from "react-router-dom";
import "./styles.css";
interface IButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: "primary" | "secondary" | "warning-primary" | "warning-secondary" | "disabled";
  size?: "default" | "small";
  newTab?: boolean;
  state?: object;
  disabled?: boolean;
}
const ButtonWrapper: React.FC<IButtonProps> = ({
  children,
  href,
  newTab = false,
  state,
  disabled = false,
}) => {
  return (href && !disabled) ? (
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
  disabled,
  ...props
}) => {
  return (
    <ButtonWrapper href={href} newTab={newTab} state={state} disabled={disabled}>
      <button
        className={`Button Button--${variant} Button--${size} ${className ?? ""}`}
        {...props}
      >
        {children}
      </button>
    </ButtonWrapper>
  );
};
export default Button;