import React from 'react';
import { trackRender } from '@/utils/performanceDiagnostics';

interface ReactReadinessWrapperProps {
  children: React.ReactNode;
}

/**
 * Simplified wrapper that just tracks render and passes through children
 * Dispatcher readiness is now checked BEFORE React initialization in main.tsx
 */
export class ReactReadinessWrapper extends React.Component<ReactReadinessWrapperProps> {
  componentDidMount() {
    trackRender('ReactReadinessWrapper');
    console.log('✅ [ReactReadinessWrapper] Component mounted - dispatcher confirmed ready');
  }

  render() {
    return <>{this.props.children}</>;
  }
}