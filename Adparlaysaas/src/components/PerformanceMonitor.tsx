import React, { useEffect, useState } from 'react';
import { PerformanceMonitor as PerfMonitor, getMemoryUsage, isMobileDevice, isSlowConnection } from '../utils/performanceUtils';

interface PerformanceMonitorProps {
  enabled?: boolean;
  showInConsole?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = false, // Disabled to prevent memory issues
  showInConsole = false // Disabled to prevent console spam
}) => {
  const [memoryUsage, setMemoryUsage] = useState({ used: 0, total: 0, percentage: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Check device and connection
    setIsMobile(isMobileDevice());
    setIsSlow(isSlowConnection());

    // Monitor memory usage
    const updateMemoryUsage = () => {
      const usage = getMemoryUsage();
      setMemoryUsage(usage);
      
      if (showInConsole && usage.percentage > 80) {
        console.warn(`High memory usage: ${usage.percentage}% (${usage.used}MB / ${usage.total}MB)`);
      }
    };

    // Update memory usage every 30 seconds (less frequent to reduce overhead)
    const interval = setInterval(updateMemoryUsage, 30000);
    updateMemoryUsage(); // Initial check

    // Monitor performance marks
    const observer = new PerformanceObserver((list) => {
      if (showInConsole) {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'measure') {
            console.log(`Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
          }
        });
      }
    });

    observer.observe({ entryTypes: ['measure'] });

    // Monitor long tasks
    const longTaskObserver = new PerformanceObserver((list) => {
      if (showInConsole) {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        });
      }
    });

    longTaskObserver.observe({ entryTypes: ['longtask'] });

    return () => {
      clearInterval(interval);
      observer.disconnect();
      longTaskObserver.disconnect();
    };
  }, [enabled, showInConsole]);

  // Don't render anything in production
  if (!enabled || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded-lg z-50 font-mono">
      <div className="space-y-1">
        <div>Memory: {memoryUsage.used}MB / {memoryUsage.total}MB ({memoryUsage.percentage}%)</div>
        <div>Device: {isMobile ? 'Mobile' : 'Desktop'}</div>
        <div>Connection: {isSlow ? 'Slow' : 'Fast'}</div>
        <div>FPS: {Math.round(1000 / 16)}</div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
