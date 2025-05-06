import React from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import './styles.css';

interface ValidationIndicatorProps {
  isLoading: boolean;
  isValid: boolean | null;
  title?: string;
}

const ValidationIndicator: React.FC<ValidationIndicatorProps> = ({
  isLoading,
  isValid,
  title,
}) => {
  return (
    <div className="ValidationIndicator" title={title}>
      {isLoading ? (
        <LoadingSpinner size={16} />
      ) : isValid ? (
        <span className="validation-icon valid">✓</span>
      ) : (
        <span className="validation-icon invalid">✕</span>
      )}
    </div>
  );
};

export default ValidationIndicator; 