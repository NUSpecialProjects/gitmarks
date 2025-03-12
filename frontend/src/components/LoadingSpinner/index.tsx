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
    <div className="LoadingSpinner">
      <ClipLoader
        size={size}
        color={color}
        loading={true}
      />
    </div>
  );
};

export default LoadingSpinner;
