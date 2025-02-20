import React, { Component, ErrorInfo } from 'react';
import { ErrorToast } from '../Toast';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  static getDerivedStateFromError(): State {
    return {
      hasError: true
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    ErrorToast(error.message || 'An unexpected error occurred');
    // Reset the error state after showing the toast
    this.setState({ hasError: false });
  }

  render() {
    return this.props.children;
  }
}

export default ErrorBoundary;