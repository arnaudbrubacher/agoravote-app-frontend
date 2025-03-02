/**
 * Mapping between HeroIcons and Lucide icons
 * This helps with migration from HeroIcons to Lucide
 */

export const heroToLucideMap = {
  // Common mappings
  'UserIcon': 'User',
  'UserGroupIcon': 'Users',
  'PlusIcon': 'Plus',
  'TrashIcon': 'Trash',
  'PencilIcon': 'Pencil',
  'DocumentIcon': 'File',
  'DocumentArrowUpIcon': 'FileUp',
  'ArrowPathIcon': 'RefreshCw',
  'ExclamationCircleIcon': 'AlertCircle',
  'ChatBubbleLeftIcon': 'MessageSquare',
  'HeartIcon': 'Heart',
  'XMarkIcon': 'X',
  'ChevronDownIcon': 'ChevronDown',
  'EnvelopeIcon': 'Mail',
  'MagnifyingGlassIcon': 'Search',
  'EllipsisVerticalIcon': 'MoreVertical',
  'UserPlusIcon': 'UserPlus',
  'UserMinusIcon': 'UserMinus',
  'ArrowRightOnRectangleIcon': 'LogOut',
  'CalendarIcon': 'Calendar',
  'HandThumbUpIcon': 'ThumbsUp',
  'ChatBubbleLeftEllipsisIcon': 'MessageSquareMore',
  'LockIcon': 'Lock',
  'UnlockIcon': 'Unlock',
  'SettingsIcon': 'Settings',
  'CameraIcon': 'Camera',
  'CheckCircleIcon': 'CheckCircle',
  'AlertCircleIcon': 'AlertCircle'
}

/**
 * Convert a HeroIcon name to its Lucide equivalent
 * @param {string} heroIconName - The HeroIcon name (e.g., "UserIcon")
 * @returns {string} - The equivalent Lucide icon name
 */
export function convertHeroToLucide(heroIconName) {
  return heroToLucideMap[heroIconName] || heroIconName;
}

/**
 * Convert a HeroIcon string format to Lucide format
 * @param {string} iconString - Icon string like "heroicons:user-group"
 * @returns {string} - The icon name in Lucide format
 */
export function convertHeroIconString(iconString) {
  if (!iconString.startsWith('heroicons:')) return iconString;
  
  // Remove the prefix
  const iconName = iconString.replace('heroicons:', '');
  
  // Convert kebab-case to PascalCase
  const pascalCase = iconName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  
  // Add "Icon" suffix if not present
  const heroIconName = pascalCase.endsWith('Icon') ? pascalCase : pascalCase + 'Icon';
  
  // Convert to Lucide equivalent
  return convertHeroToLucide(heroIconName);
} 