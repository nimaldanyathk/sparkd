export const Skeleton = ({ className = '', ...props }) => (
  <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} {...props} />
);
