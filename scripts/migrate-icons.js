/**
 * Icon Migration Helper Script
 * 
 * This script helps migrate from Nuxt Icon to LucideIcon
 * Usage: node scripts/migrate-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the mapping from iconMapping.js
// We'll define the mapping directly here since importing might be complex
const heroToLucideMap = {
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
  'ChatBubbleLeftEllipsisIcon': 'MessageSquareMore'
};

// Mapping of heroicons to Lucide icons
const iconMapping = {
  // Common mappings from heroToLucideMap
  ...heroToLucideMap,
  
  // Additional mappings for kebab-case heroicons
  'user-group': 'Users',
  'arrow-path': 'RefreshCw',
  'exclamation-circle': 'AlertCircle',
  'chat-bubble-left': 'MessageSquare',
  'x-mark': 'X',
  'chevron-down': 'ChevronDown',
  'envelope': 'Mail',
  'magnifying-glass': 'Search',
  'ellipsis-vertical': 'MoreVertical',
  'user-plus': 'UserPlus',
  'user-minus': 'UserMinus',
  'arrow-right-on-rectangle': 'LogOut',
  'calendar': 'Calendar',
  'hand-thumb-up': 'ThumbsUp',
  'chat-bubble-left-ellipsis': 'MessageSquareMore',
  'document-arrow-up': 'FileUp',
  'document': 'File',
  'plus': 'Plus',
  'trash': 'Trash',
  'pencil': 'Pencil'
};

/**
 * Convert a Nuxt Icon usage to LucideIcon
 * 
 * @param {string} line - The line containing the Nuxt Icon usage
 * @returns {string} - The line with LucideIcon usage
 */
function convertNuxtIconToLucideIcon(line) {
  // Match Nuxt Icon usage pattern
  const iconRegex = /<Icon\s+name="heroicons:([^"]+)"([^>]*)\/>/;
  const match = line.match(iconRegex);
  
  if (!match) return line;
  
  const [fullMatch, iconName, attributes] = match;
  
  // Get the Lucide equivalent
  const lucideIconName = iconMapping[iconName] || 'QuestionMark';
  
  // Extract class attribute if present
  const classMatch = attributes.match(/class="([^"]+)"/);
  const classAttr = classMatch ? classMatch[1] : '';
  
  // Extract size from class (e.g., h-4 w-4)
  const sizeMatch = classAttr.match(/h-(\d+)/);
  const size = sizeMatch ? sizeMatch[1] : '24';
  
  // Create LucideIcon usage
  return line.replace(
    fullMatch, 
    `<LucideIcon name="${lucideIconName}" size="${size}" class="${classAttr}" />`
  );
}

/**
 * Process a file to replace Nuxt Icon with LucideIcon
 * 
 * @param {string} filePath - Path to the file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let modified = false;
    
    // Check if the file uses Nuxt Icon
    if (!content.includes('<Icon name="heroicons:')) {
      return;
    }
    
    // Process each line
    const newLines = lines.map(line => {
      if (line.includes('<Icon name="heroicons:')) {
        modified = true;
        return convertNuxtIconToLucideIcon(line);
      }
      return line;
    });
    
    // Add import if needed
    if (modified && !content.includes('import LucideIcon')) {
      const scriptSetupIndex = newLines.findIndex(line => line.includes('<script setup>'));
      if (scriptSetupIndex !== -1) {
        newLines.splice(scriptSetupIndex + 1, 0, "import LucideIcon from '@/components/LucideIcon.vue'");
      } else {
        // Add script setup section if not present
        newLines.push('<script setup>');
        newLines.push("import LucideIcon from '@/components/LucideIcon.vue'");
        newLines.push('</script>');
      }
    }
    
    // Write back to file
    if (modified) {
      fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

/**
 * Recursively process all Vue files in a directory
 * 
 * @param {string} dir - Directory to process
 */
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.vue')) {
      processFile(filePath);
    }
  }
}

// Main execution
console.log('Starting icon migration...');
// Get the project root directory
const projectRoot = path.resolve(__dirname, '..');
processDirectory(path.join(projectRoot, 'components'));
processDirectory(path.join(projectRoot, 'pages'));
console.log('Icon migration complete!');