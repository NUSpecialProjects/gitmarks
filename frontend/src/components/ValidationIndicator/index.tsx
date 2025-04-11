import React from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import './styles.css';

interface ValidationIndicatorProps {
  isLoading: boolean;
  isValid: boolean | null;
}

const ValidationIndicator: React.FC<ValidationIndicatorProps> = ({
  isLoading,
  isValid,
}) => {
  return (
    <div className="ValidationIndicator">
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