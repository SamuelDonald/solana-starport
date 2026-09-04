export function StarField() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div className="starfield absolute inset-0 opacity-80" />
      <div
        className="starfield absolute inset-0 opacity-40"
        style={{ animationDuration: "260s", backgroundSize: "420px 420px" }}
      />
      <div className="grid-horizon absolute inset-0" />
      <div className="absolute -left-40 top-[-10rem] h-[38rem] w-[38rem] rounded-full bg-nebula/25 blur-[140px]" />
      <div className="absolute -right-32 top-40 h-[34rem] w-[34rem] rounded-full bg-primary/25 blur-[150px]" />
      <div className="absolute bottom-[-14rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-accent/15 blur-[150px]" />
    </div>
  );
}
