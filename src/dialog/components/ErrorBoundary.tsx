// src/dialog/components/ErrorBoundary.tsx

/* global Office */

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleClose = (): void => {
    try {
      Office.context.ui.messageParent(JSON.stringify({ action: "CLOSE" }));
    } catch {
      // dialog may already be closed
    }
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 32,
            fontFamily: "Segoe UI, sans-serif",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
          }}
        >
          <h2 style={{ margin: "0 0 8px" }}>Something went wrong</h2>
          <p style={{ color: "#666", margin: "0 0 16px", maxWidth: 400 }}>
            Speak Logic encountered an unexpected error. Please close and reopen this dialog.
          </p>
          {this.state.error && (
            <pre
              style={{
                fontSize: 12,
                color: "#999",
                maxHeight: 200,
                overflow: "auto",
                textAlign: "left",
                background: "#f5f5f5",
                padding: 12,
                borderRadius: 4,
                width: "100%",
                maxWidth: 500,
                marginBottom: 16,
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleClose}
            style={{
              padding: "8px 24px",
              fontSize: 14,
              cursor: "pointer",
              background: "#0078d4",
              color: "#fff",
              border: "none",
              borderRadius: 4,
            }}
          >
            Close
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
