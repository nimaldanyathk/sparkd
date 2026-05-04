export const Alert = ({ children, variant = 'default', className = '', ...props }) => {
  const variants = {
    default: 'bg-blue-50 border-blue-200 text-blue-800',
    destructive: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className={`rounded-lg border p-4 ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const AlertDescription = ({ children, className = '', ...props }) => (
  <div className={`text-sm ${className}`} {...props}>
    {children}
  </div>
);