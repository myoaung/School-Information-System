/**
 * SkeletonCard - Card-shaped skeleton for overview cards, profile cards, etc.
 * Matches real card dimensions: rounded-2xl with shadow and padding
 */

import { SkeletonBase } from './SkeletonBase';
import { SkeletonText, SkeletonTextGroup } from './SkeletonText';

export function SkeletonCard({ className = '' }) {
  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 ${className}`}
    />
  );
}

export function SkeletonStatCard({ className = '' }) {
  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonText width="w-20" height="h-3" />
          <SkeletonText width="w-16" height="h-7" />
        </div>
        <SkeletonBase width="w-10" height="h-10" rounded="rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonOverviewCard({ className = '' }) {
  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 ${className}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <SkeletonBase width="w-8" height="h-8" rounded="rounded-lg" />
        <SkeletonText width="w-40" height="h-5" />
      </div>
      <SkeletonTextGroup lines={3} spacing="space-y-3" />
    </div>
  );
}
