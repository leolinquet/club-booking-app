import { useEffect, useRef } from 'react';
import nprogress from 'nprogress';

// Import nprogress styles (we'll override some in our CSS)
import 'nprogress/nprogress.css';

/**
 * Custom hook for managing nprogress top progress bar
 * Provides methods to start, stop, and increment progress
 * 
 * @returns {Object} Progress control methods
 */
export const useNProgress = () => {
  const isStartedRef = useRef(false);

  useEffect(() => {
    // Configure nprogress
    nprogress.configure({
      showSpinner: false, // We'll use our own spinners
      minimum: 0.1,
      speed: 500,
      trickleSpeed: 200,
      parent: 'body'
    });

    return () => {
      // Cleanup on unmount
      if (isStartedRef.current) {
        nprogress.done();
        isStartedRef.current = false;
      }
    };
  }, []);

  const start = () => {
    if (!isStartedRef.current) {
      nprogress.start();
      isStartedRef.current = true;
    }
  };

  const done = () => {
    if (isStartedRef.current) {
      nprogress.done();
      isStartedRef.current = false;
    }
  };

  const set = (progress) => {
    nprogress.set(progress);
  };

  const inc = (amount) => {
    nprogress.inc(amount);
  };

  return {
    start,
    done,
    set,
    inc,
    get isStarted() {
      return isStartedRef.current;
    }
  };
};

/**
 * Component that automatically manages progress for async operations
 * 
 * @param {Object} props
 * @param {boolean} props.isLoading - Whether operation is in progress
 * @param {number} props.progress - Optional specific progress value (0-1)
 * @returns {null}
 */
export const ProgressIndicator = ({ isLoading, progress }) => {
  const { start, done, set } = useNProgress();

  useEffect(() => {
    if (isLoading) {
      start();
    } else {
      done();
    }
  }, [isLoading, start, done]);

  useEffect(() => {
    if (typeof progress === 'number' && progress >= 0 && progress <= 1) {
      set(progress);
    }
  }, [progress, set]);

  return null;
};

export default useNProgress;