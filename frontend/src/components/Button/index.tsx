import { Link } from "react-router-dom";

import "./styles.css";

interface IButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: "primary" | "secondary";
  size?: "default" | "small";
  newTab?: boolean;
}

const ButtonWrapper: React.FC<IButtonProps> = ({ children, href, newTab }) => {
  return href ? (
    <Link to={href} target={newTab ? "_blank" : "_self"}>
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
  newTab = false,
  ...props
}) => {
  return (
    <ButtonWrapper href={href}>
      <button className={`Button Button--${variant} ${className}`} {...props}>
        {children}
      </button>
    </ButtonWrapper>
  );
};

export default Button;
