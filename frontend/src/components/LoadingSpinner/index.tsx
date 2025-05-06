import { ClipLoader } from "react-spinners";

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 50,
  color = "#0066CC"
}) => {
  return (
    <ClipLoader
      size={size}
      color={color}
      loading={true}
      className="LoadingSpinner"
    />
  );
};

export default LoadingSpinner;
