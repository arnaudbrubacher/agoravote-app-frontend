# Icon Migration Guide: Standardizing on Lucide Icons

This guide outlines the process for migrating all icon usages in our application to Lucide icons.

## Why Standardize on Lucide?

- **Modern & Maintained**: Lucide is actively maintained and regularly updated
- **Consistent Design**: All icons follow the same design principles
- **Vue Integration**: Excellent Vue 3 support via `lucide-vue-next`
- **TypeScript Support**: Full TypeScript support for better developer experience
- **Smaller Bundle Size**: Optimized for tree-shaking and smaller bundle size

## Current Icon Usage in Our App

Our application currently uses multiple icon libraries:

1. **HeroIcons (@heroicons/vue/outline)**
   - Direct imports: `import { UserIcon } from '@heroicons/vue/outline'`
   - Custom wrapper: `<Icon name="icon:UserIcon" />`

2. **Lucide Icons (lucide-vue-next)**
   - Direct imports: `import { User } from 'lucide-vue-next'`

3. **Iconify (@iconify/vue)**
   - Usage: `import { Icon } from '@iconify/vue'`

4. **Nuxt Icon (nuxt-icon)**
   - Usage: `<Icon name="heroicons:user" />`

## Migration Steps

### 1. Use the Migration Script

We've created a script to help automate the migration process:

```bash
# Create the scripts directory if it doesn't exist
mkdir -p scripts

# Run the migration script
node scripts/migrate-icons.js
```

This script will:
- Find all Nuxt Icon usages (`<Icon name="heroicons:...">`)
- Replace them with LucideIcon component usages
- Add the necessary imports

### 2. Manual Migration for Direct HeroIcon Imports

For files that directly import HeroIcons, update them as follows:

```javascript
// Before
import { UserGroupIcon } from '@heroicons/vue/outline'

// After
import { Users } from 'lucide-vue-next'
```

And update the component usage:

```html
<!-- Before -->
<UserGroupIcon class="h-6 w-6" />

<!-- After -->
<Users size="24" />
```

### 3. Update Icon.vue Component

Our custom Icon.vue component has been updated to use Lucide icons. If you're using the old format:

```html
<Icon name="icon:UserIcon" />
```

You can continue using this format, as the component now maps to Lucide icons.

### 4. Replace Iconify Usage

For components using Iconify:

```javascript
// Before
import { Icon } from '@iconify/vue'

// After
import LucideIcon from '@/components/LucideIcon.vue'
```

And in the template:

```html
<!-- Before -->
<Icon icon="some-icon" />

<!-- After -->
<LucideIcon name="SomeIcon" />
```

## Icon Name Mapping

Here's a mapping of common HeroIcons to their Lucide equivalents:

| HeroIcons (Outline) | Lucide Equivalent |
|---------------------|-------------------|
| UserIcon            | User              |
| UserGroupIcon       | Users             |
| PlusIcon            | Plus              |
| TrashIcon           | Trash             |
| PencilIcon          | Pencil            |
| DocumentIcon        | File              |
| ArrowPathIcon       | RefreshCw         |
| XMarkIcon           | X                 |
| ChevronDownIcon     | ChevronDown       |
| EnvelopeIcon        | Mail              |
| MagnifyingGlassIcon | Search            |

For a complete mapping, see `lib/iconMapping.js`.

## Testing After Migration

After migrating icons, thoroughly test your application to ensure:

1. All icons display correctly
2. No console errors related to icons
3. Icon sizes and colors are consistent

## Troubleshooting

### Missing Icons

If you encounter a missing icon after migration:

1. Check the icon name in Lucide documentation: https://lucide.dev/icons/
2. Update the mapping in `lib/iconMapping.js` if needed
3. Use the correct Lucide icon name

### Size Differences

Lucide uses the `size` prop instead of CSS classes:

```html
<!-- Before (HeroIcons) -->
<UserIcon class="h-6 w-6" />

<!-- After (Lucide) -->
<User size="24" />
```

### Stroke Width

Lucide allows customizing stroke width:

```html
<User strokeWidth="1.5" />
```

## Need Help?

If you encounter any issues during migration, please reach out to the frontend team. 