import React, { Component, ErrorInfo } from 'react';
import { ErrorToast } from '../Toast';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

// Any thrown errors within the boundary will be caught and displayed as an error toast
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

  componentDidCatch(error: Error, _: ErrorInfo) {
    ErrorToast(error.message || 'An unexpected error occurred');
  }

  render() {
    if (this.state.hasError) {
      return ( //TODO: this should be a nice looking error page
        <div>
          <h2>Something went wrong</h2>
          <p>We are very sad</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;