export const Label = ({ children, className = '', ...props }) => (
  <label className={`text-sm font-medium text-gray-900 ${className}`} {...props}>
    {children}
  </label>
);
