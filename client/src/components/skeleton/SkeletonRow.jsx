/**
 * SkeletonRow - Table row skeleton
 * Matches real table structure with cells for each column
 */

import { SkeletonText } from './SkeletonText';
import { SkeletonAvatar } from './SkeletonAvatar';

export function SkeletonRow({ columns = 7, hasAvatar = false, hasActions = false }) {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          {hasAvatar && i === 0 ? (
            <div className="flex items-center gap-3">
              <SkeletonAvatar size="sm" />
              <SkeletonText width="w-24" height="h-4" />
            </div>
          ) : hasActions && i === columns - 1 ? (
            <div className="flex gap-2">
              <SkeletonText width="w-12" height="h-6" />
              <SkeletonText width="w-12" height="h-6" />
            </div>
          ) : (
            <SkeletonText
              width={i === 0 ? 'w-20' : i === columns - 1 ? 'w-16' : 'w-full'}
              height="h-4"
            />
          )}
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTableHeader({ columns = 7, labels = null }) {
  return (
    <thead>
      <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
        {Array.from({ length: columns }).map((_, i) => (
          <th key={i} scope="col" className="px-4 py-3 text-left font-medium">
            {labels?.[i] || <SkeletonText width="w-20" height="h-4" rounded="rounded-none" />}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function SkeletonTable({
  columns = 7,
  rows = 5,
  hasAvatar = false,
  hasActions = false,
  headerLabels = null,
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <SkeletonTableHeader columns={columns} labels={headerLabels} />
          <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
            {Array.from({ length: rows }).map((_, i) => (
              <SkeletonRow
                key={i}
                columns={columns}
                hasAvatar={hasAvatar}
                hasActions={hasActions}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
