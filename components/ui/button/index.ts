import { cva } from 'class-variance-authority'

export { default as Button } from './Button.vue'

export const buttonVariants = cva('base-class', {
  variants: {
    variant: {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-500 text-white',
    },
    size: {
      small: 'text-sm px-2 py-1',
      medium: 'text-base px-4 py-2',
      large: 'text-lg px-6 py-3',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'medium',
  },
})

export type ButtonVariants = typeof buttonVariants
