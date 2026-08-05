/**
 * SkeletonAvatar - Circular avatar placeholder
 * Matches real avatar sizes used across the app
 */

import { SkeletonBase } from './SkeletonBase';
import { SkeletonText } from './SkeletonText';

export function SkeletonAvatar({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <SkeletonBase
      rounded="rounded-full"
      width={sizes[size].split(' ')[0]}
      height={sizes[size].split(' ')[1]}
      className={className}
    />
  );
}

export function SkeletonAvatarText({ size = 'md' }) {
  return (
    <div className="flex items-center gap-3">
      <SkeletonAvatar size={size} />
      <div className="space-y-2">
        <SkeletonText width="w-32" height="h-4" />
        <SkeletonText width="w-24" height="h-3" />
      </div>
    </div>
  );
}
