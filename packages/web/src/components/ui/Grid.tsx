import React from 'react'
import { cn } from '../../utils/cn'

// Grid Container
export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: {
    base?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  gap?: number | string
  rowGap?: number | string
  colGap?: number | string
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols, gap, rowGap, colGap, children, ...props }, ref) => {
    const getGridClasses = () => {
      const classes: string[] = ['grid']

      // Grid columns
      if (cols) {
        if (cols.base) classes.push(`grid-cols-${cols.base}`)
        if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`)
        if (cols.md) classes.push(`md:grid-cols-${cols.md}`)
        if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`)
        if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`)
        if (cols['2xl']) classes.push(`2xl:grid-cols-${cols['2xl']}`)
      }

      // Gap
      if (gap !== undefined) {
        if (typeof gap === 'number') {
          classes.push(`gap-${gap}`)
        } else {
          classes.push(`gap-[${gap}]`)
        }
      }

      // Row gap
      if (rowGap !== undefined) {
        if (typeof rowGap === 'number') {
          classes.push(`gap-y-${rowGap}`)
        } else {
          classes.push(`gap-y-[${rowGap}]`)
        }
      }

      // Column gap
      if (colGap !== undefined) {
        if (typeof colGap === 'number') {
          classes.push(`gap-x-${colGap}`)
        } else {
          classes.push(`gap-x-[${colGap}]`)
        }
      }

      return classes.join(' ')
    }

    return (
      <div
        ref={ref}
        className={cn(getGridClasses(), className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Grid.displayName = 'Grid'

// Grid Item
export interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  colSpan?: {
    base?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  rowSpan?: {
    base?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  colStart?: {
    base?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  rowStart?: {
    base?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
}

const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(
  ({ className, colSpan, rowSpan, colStart, rowStart, children, ...props }, ref) => {
    const getGridItemClasses = () => {
      const classes: string[] = []

      // Column span
      if (colSpan) {
        if (colSpan.base) classes.push(`col-span-${colSpan.base}`)
        if (colSpan.sm) classes.push(`sm:col-span-${colSpan.sm}`)
        if (colSpan.md) classes.push(`md:col-span-${colSpan.md}`)
        if (colSpan.lg) classes.push(`lg:col-span-${colSpan.lg}`)
        if (colSpan.xl) classes.push(`xl:col-span-${colSpan.xl}`)
        if (colSpan['2xl']) classes.push(`2xl:col-span-${colSpan['2xl']}`)
      }

      // Row span
      if (rowSpan) {
        if (rowSpan.base) classes.push(`row-span-${rowSpan.base}`)
        if (rowSpan.sm) classes.push(`sm:row-span-${rowSpan.sm}`)
        if (rowSpan.md) classes.push(`md:row-span-${rowSpan.md}`)
        if (rowSpan.lg) classes.push(`lg:row-span-${rowSpan.lg}`)
        if (rowSpan.xl) classes.push(`xl:row-span-${rowSpan.xl}`)
        if (rowSpan['2xl']) classes.push(`2xl:row-span-${rowSpan['2xl']}`)
      }

      // Column start
      if (colStart) {
        if (colStart.base) classes.push(`col-start-${colStart.base}`)
        if (colStart.sm) classes.push(`sm:col-start-${colStart.sm}`)
        if (colStart.md) classes.push(`md:col-start-${colStart.md}`)
        if (colStart.lg) classes.push(`lg:col-start-${colStart.lg}`)
        if (colStart.xl) classes.push(`xl:col-start-${colStart.xl}`)
        if (colStart['2xl']) classes.push(`2xl:col-start-${colStart['2xl']}`)
      }

      // Row start
      if (rowStart) {
        if (rowStart.base) classes.push(`row-start-${rowStart.base}`)
        if (rowStart.sm) classes.push(`sm:row-start-${rowStart.sm}`)
        if (rowStart.md) classes.push(`md:row-start-${rowStart.md}`)
        if (rowStart.lg) classes.push(`lg:row-start-${rowStart.lg}`)
        if (rowStart.xl) classes.push(`xl:row-start-${rowStart.xl}`)
        if (rowStart['2xl']) classes.push(`2xl:row-start-${rowStart['2xl']}`)
      }

      return classes.join(' ')
    }

    return (
      <div
        ref={ref}
        className={cn(getGridItemClasses(), className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GridItem.displayName = 'GridItem'

// Flex utilities for quick layouts
export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse'
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse'
  gap?: number | string
}

const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  ({ className, direction = 'row', align, justify, wrap, gap, children, ...props }, ref) => {
    const getFlexClasses = () => {
      const classes: string[] = ['flex']

      // Direction
      if (direction !== 'row') {
        classes.push(`flex-${direction}`)
      }

      // Align items
      if (align) {
        const alignMap = {
          start: 'items-start',
          center: 'items-center',
          end: 'items-end',
          stretch: 'items-stretch',
          baseline: 'items-baseline',
        }
        classes.push(alignMap[align])
      }

      // Justify content
      if (justify) {
        const justifyMap = {
          start: 'justify-start',
          center: 'justify-center',
          end: 'justify-end',
          between: 'justify-between',
          around: 'justify-around',
          evenly: 'justify-evenly',
        }
        classes.push(justifyMap[justify])
      }

      // Wrap
      if (wrap) {
        classes.push(`flex-${wrap}`)
      }

      // Gap
      if (gap !== undefined) {
        if (typeof gap === 'number') {
          classes.push(`gap-${gap}`)
        } else {
          classes.push(`gap-[${gap}]`)
        }
      }

      return classes.join(' ')
    }

    return (
      <div
        ref={ref}
        className={cn(getFlexClasses(), className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Flex.displayName = 'Flex'

export { Grid, GridItem, Flex }