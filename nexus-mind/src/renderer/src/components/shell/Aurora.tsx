/**
 * Animated aurora backdrop. Pure CSS transforms on blurred layers, so it
 * runs on the compositor at 60fps without touching React.
 */
export function Aurora(): JSX.Element {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="absolute -top-1/3 start-[-10%] h-[70vh] w-[60vw] animate-aurora rounded-full opacity-[0.16] blur-[120px]"
        style={{ background: 'radial-gradient(circle, var(--aurora-1), transparent 70%)' }}
      />
      <div
        className="absolute -bottom-1/3 end-[-10%] h-[70vh] w-[55vw] animate-aurora-slow rounded-full opacity-[0.12] blur-[120px]"
        style={{ background: 'radial-gradient(circle, var(--aurora-2), transparent 70%)' }}
      />
      <div
        className="absolute top-1/3 start-1/3 h-[40vh] w-[30vw] animate-aurora rounded-full opacity-[0.07] blur-[110px]"
        style={{ background: 'radial-gradient(circle, var(--aurora-3), transparent 70%)' }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(rgb(var(--c-fg)/0.035)_1px,transparent_1px)] [background-size:22px_22px]" />
    </div>
  );
}
