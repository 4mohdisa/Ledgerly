import { useState, useMemo } from 'react';

interface UseSortTableOptions<T> {
  data: T[];
  defaultSortKey: keyof T | string;
  defaultDirection: 'asc' | 'desc';
}

export function useSortTable<T>({ 
  data, 
  defaultSortKey, 
  defaultDirection = 'desc' 
}: UseSortTableOptions<T>) {
  const [sortBy, setSortBy] = useState<keyof T | string>(defaultSortKey);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultDirection);
  
  // Toggle sort direction or set new sort key
  const toggleSort = (key: keyof T | string) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };
  
  // Sort data based on current sort key and direction
  const sortedData = useMemo(() => {
    if (!data || !data.length) return [];
    
    return [...data].sort((a, b) => {
      const aVal = a[sortBy as keyof T];
      const bVal = b[sortBy as keyof T];
      
      // Handle null or undefined values
      if (aVal == null) return sortDirection === 'asc' ? -1 : 1;
      if (bVal == null) return sortDirection === 'asc' ? 1 : -1;
      
      // Sort based on type
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      } else if (aVal instanceof Date && bVal instanceof Date) {
        return sortDirection === 'asc' 
          ? aVal.getTime() - bVal.getTime()
          : bVal.getTime() - aVal.getTime();
      }
      
      // Fallback for other types
      const stringA = String(aVal);
      const stringB = String(bVal);
      
      return sortDirection === 'asc'
        ? stringA.localeCompare(stringB)
        : stringB.localeCompare(stringA);
    });
  }, [data, sortBy, sortDirection]);
  
  return {
    data: sortedData,
    sortBy,
    sortDirection,
    toggleSort,
    setSortBy,
    setSortDirection
  };
}
