interface DashboardProps {
  className?: string;
}

export function Dashboard({ className }: DashboardProps) {
  return (
    <div className={className}>
      <div className="space-y-8">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            data-testid="text-page-title"
          >
            Overview
          </h1>
          <p className="text-muted-foreground">
            Monitor your services and infrastructure health
          </p>
        </div>
      </div>
    </div>
  );
}
