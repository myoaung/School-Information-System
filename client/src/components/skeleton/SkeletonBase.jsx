/**
 * SkeletonBase - Shared pulse-div primitive
 * All skeleton components compose from this for consistent animation timing.
 */

export function SkeletonBase({
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded',
  className = '',
  as: Tag = 'div',
}) {
  return (
    <Tag
      className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${rounded} ${width} ${height} ${className}`}
    />
  );
}
