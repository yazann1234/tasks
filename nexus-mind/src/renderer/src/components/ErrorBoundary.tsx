import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { i18n } from '../i18n';

interface Props {
  children: ReactNode;
  /** Changing this key resets the boundary (e.g. on navigation). */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors in a subtree and shows a recoverable fallback,
 * so one broken view never takes down the whole app.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('View crashed', error, info.componentStack);
  }

  override componentDidUpdate(prev: Props): void {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-danger/15 text-danger">
          <AlertTriangle size={22} />
        </div>
        <div>
          <h2 className="font-display text-lg">{i18n.t('errors.boundaryTitle')}</h2>
          <p className="mt-1 max-w-sm text-sm text-muted">{i18n.t('errors.boundaryBody')}</p>
          <pre className="mt-3 max-w-md overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs text-subtle" dir="ltr">
            {this.state.error.message}
          </pre>
        </div>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          className="focus-ring inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
        >
          <RotateCcw size={14} />
          {i18n.t('common.retry')}
        </button>
      </div>
    );
  }
}
