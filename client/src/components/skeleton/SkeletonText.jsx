/**
 * SkeletonText - Reusable text placeholder for loading states
 * Matches real text dimensions to prevent layout shift
 */

import { SkeletonBase } from './SkeletonBase';

export function SkeletonText({
  width = 'w-full',
  height = 'h-4',
  className = '',
  rounded = 'rounded',
}) {
  return <SkeletonBase width={width} height={height} rounded={rounded} className={className} />;
}

export function SkeletonTextGroup({ lines = 3, spacing = 'space-y-2' }) {
  return (
    <div className={spacing}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonText key={i} width={i === lines - 1 ? 'w-3/4' : 'w-full'} />
      ))}
    </div>
  );
}
