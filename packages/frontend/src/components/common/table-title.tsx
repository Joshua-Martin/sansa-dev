export const TableTitle = ({
  children,
  description,
  buttons,
}: {
  children: React.ReactNode;
  description?: React.ReactNode;
  buttons?: React.ReactNode;
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{children}</h1>
        </div>
        {description && (
          <span className="text-md text-muted-foreground">{description}</span>
        )}
      </div>
      {buttons && <div className="flex items-center gap-2">{buttons}</div>}
    </div>
  );
};
TableTitle.displayName = 'TableTitle';
