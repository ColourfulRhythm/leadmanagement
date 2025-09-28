// Performance optimization utilities

/**
 * Debounce function to limit the rate of function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

/**
 * Throttle function to limit the rate of function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Add passive event listener for better scroll performance
 */
export function addPassiveEventListener(
  element: EventTarget,
  event: string,
  handler: EventListener,
  options: AddEventListenerOptions = {}
): void {
  const passiveOptions = {
    passive: true,
    ...options
  };
  
  element.addEventListener(event, handler, passiveOptions);
}

/**
 * Remove event listener with passive options
 */
export function removePassiveEventListener(
  element: EventTarget,
  event: string,
  handler: EventListener,
  options: AddEventListenerOptions = {}
): void {
  const passiveOptions = {
    passive: true,
    ...options
  };
  
  element.removeEventListener(event, handler, passiveOptions);
}

/**
 * Optimized scroll handler with passive listeners
 */
export function createOptimizedScrollHandler(
  callback: (event: Event) => void,
  throttleMs = 16 // ~60fps
) {
  const throttledCallback = throttle(callback, throttleMs);
  
  return {
    add: (element: EventTarget = window) => {
      addPassiveEventListener(element, 'scroll', throttledCallback);
    },
    remove: (element: EventTarget = window) => {
      removePassiveEventListener(element, 'scroll', throttledCallback);
    }
  };
}

/**
 * Optimized touch handler with passive listeners
 */
export function createOptimizedTouchHandler(
  callback: (event: Event) => void,
  throttleMs = 16
) {
  const throttledCallback = throttle(callback, throttleMs);
  
  return {
    add: (element: EventTarget) => {
      addPassiveEventListener(element, 'touchstart', throttledCallback);
      addPassiveEventListener(element, 'touchmove', throttledCallback);
      addPassiveEventListener(element, 'touchend', throttledCallback);
    },
    remove: (element: EventTarget) => {
      removePassiveEventListener(element, 'touchstart', throttledCallback);
      removePassiveEventListener(element, 'touchmove', throttledCallback);
      removePassiveEventListener(element, 'touchend', throttledCallback);
    }
  };
}

/**
 * Intersection Observer for lazy loading
 */
export function createLazyLoadObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };
  
  return new IntersectionObserver(callback, defaultOptions);
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private marks: Map<string, number> = new Map();
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  mark(name: string): void {
    this.marks.set(name, performance.now());
  }
  
  measure(name: string, startMark: string): number {
    const startTime = this.marks.get(startMark);
    const endTime = performance.now();
    
    if (startTime) {
      const duration = endTime - startTime;
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
      return duration;
    }
    
    return 0;
  }
  
  clear(): void {
    this.marks.clear();
  }
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
} {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
    };
  }
  
  return { used: 0, total: 0, percentage: 0 };
}

/**
 * Check if device is mobile for performance optimizations
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Check if connection is slow
 */
export function isSlowConnection(): boolean {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
  }
  return false;
}

/**
 * Optimize images for better performance
 */
export function optimizeImageUrl(url: string, width?: number, quality = 80): string {
  // For external images, you might want to use a service like Cloudinary or ImageKit
  // For now, we'll return the original URL
  return url;
}

/**
 * Preload critical resources
 */
export function preloadResource(href: string, as: string, type?: string): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  document.head.appendChild(link);
}

/**
 * Clean up event listeners and observers
 */
export function cleanupPerformanceResources(): void {
  // Clear performance marks
  PerformanceMonitor.getInstance().clear();
  
  // Clear any global event listeners if needed
  // This would be called when the app unmounts
}
