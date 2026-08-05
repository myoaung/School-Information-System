# Skeleton Loading System

## Components Created

### Base Primitives (`/client/src/components/skeleton/`)
- **SkeletonText** - Text placeholder with configurable width/height
- **SkeletonTextGroup** - Multiple text lines with spacing
- **SkeletonCard** - Card container matching existing `rounded-2xl shadow-md p-6` pattern
- **SkeletonStatCard** - Dashboard stat card (icon + label + value)
- **SkeletonOverviewCard** - Section with header icon + title + content
- **SkeletonAvatar** - Circular avatar (sm/md/lg/xl sizes)
- **SkeletonAvatarText** - Avatar + name/email combo

### View-Specific Skeletons
- **DashboardSkeleton** - Matches DashboardPage: 4 stat cards, at-risk students, lifecycle, announcements, profile grid
- **TableSkeleton** - Matches StudentsPage/TeachersPage/ClassesPage: header + 5-8 rows with 7 columns, pagination
- **FinanceSkeleton** - Matches FinancePage: tabs, overview cards, invoice list + detail
- **ParentFinanceSkeleton** - Matches ParentPortalPage: header banner, stats, tab content

## Integration Points

| Page | Skeleton | Loading State |
|------|----------|---------------|
| DashboardPage | `DashboardSkeleton` | `loading` from useState |
| StudentsPage | `TableSkeleton` | `loading` from useState |
| TeachersPage | `TableSkeleton` | `loading` from useState |
| ClassesPage | `TableSkeleton` | `loading` from useState |
| FinancePage | `FinanceSkeleton` | `loading && !overview && invoices.length === 0` |

## Design System Alignment

**Colors:** Matches existing pattern
- Light: `bg-purple-200` or `bg-gray-200`
- Dark: `dark:bg-gray-700`
- Animation: `animate-pulse` (consistent 1.5s timing across all)

**Layout Dimensions:**
- Cards: `rounded-2xl shadow-md shadow-purple-100/50 p-6`
- Tables: `w-full text-sm`, cells `px-4 py-3`
- Stats grid: `grid grid-cols-2 md:grid-cols-4 gap-4 mb-8`
- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`

## isLoading vs isFetching Tradeoff

**Current Implementation (isLoading only):**
```jsx
if (loading) return <Skeleton />
```
- Shows skeleton only on initial page load
- Refetches (search, filter, pagination) don't flash skeleton
- **Pro:** Better UX for interactions, no jarring flashes
- **Con:** Users don't see visual feedback during refetch

**Alternative (isFetching):**
```jsx
if (isFetching) return <Skeleton />
```
- Shows skeleton on EVERY fetch (initial + refetch)
- **Pro:** Clear feedback that data is refreshing
- **Con:** Annoying flash when searching/filtering

**Recommendation:** Stick with `isLoading` (current).
For refetch feedback, use subtle indicators like:
- Dimmed opacity on table: `opacity-60`
- Small spinner in header/search bar
- Or TanStack Query's `isFetching` with a toast notification

## Usage Example

```jsx
import { DashboardSkeleton } from '../components/skeleton'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    setLoading(true)
    api.get('/reports/dashboard')
      .then(r => setStats(r.data.dashboard))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Real content */}
    </div>
  )
}
```

## Future Enhancements

1. **Add TanStack Query** - Better cache management, automatic isFetching states
2. **Staggered animations** - Pulse timing offset per row for wave effect
3. **Custom shimmer gradient** - Replace solid bg with gradient animation
4. **Reduced motion support** - Respect `prefers-reduced-motion` media query
5. **Progressive loading** - Load critical content first, skeleton for secondary
