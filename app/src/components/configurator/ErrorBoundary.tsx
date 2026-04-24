"use client";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

/**
 * Fängt React-Fehler innerhalb des Konfigurators ab, damit ein Throw in
 * einer tief verschachtelten Komponente den iframe nicht komplett weiß
 * rendert. Auf iOS Safari kann ein weißer/zerrüttelter iframe-Inhalt als
 * "This page couldn't load" ausgeliefert werden; mit diesem Fallback
 * bleibt zumindest eine strukturierte Fehlermeldung mit Reload-Option.
 *
 * Die Implementation ist eine klassische Error-Boundary (Class-Component),
 * weil React Function-Components bis heute keine Error-Hooks bieten.
 */
export class ConfiguratorErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ info });
    if (typeof console !== "undefined") {
      console.error("[configurator] caught error:", error, info.componentStack);
    }
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background p-6">
          <div className="mx-auto max-w-xl rounded-lg border-2 border-destructive/40 bg-destructive/5 p-4 text-sm">
            <p className="font-semibold text-destructive mb-1">
              Der Konfigurator hat einen unerwarteten Zustand erreicht.
            </p>
            <p className="text-muted-foreground mb-3">
              Bitte die Seite neu laden. Wenn der Fehler bestehen bleibt,
              informieren Sie bitte den Vertrieb.
            </p>
            <details className="text-xs text-muted-foreground opacity-70 mb-3">
              <summary className="cursor-pointer">Technische Details</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words">
                {String(this.state.error?.message ?? this.state.error)}
              </pre>
            </details>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Neu laden
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
