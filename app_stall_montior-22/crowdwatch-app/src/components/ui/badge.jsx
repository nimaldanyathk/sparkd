export const Badge = ({ children, variant = 'default', className = '', ...props }) => {
  const variants = {
    default: 'bg-blue-100 text-blue-800 border-blue-200',
    outline: 'border border-gray-300 bg-white text-gray-700',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};