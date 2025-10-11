import { useState, useCallback, useRef } from 'react';
import { useNProgress } from './useNProgress';

/**
 * Enhanced fetch wrapper with loading states and progress tracking
 * Automatically manages nprogress and provides pending request counter
 * 
 * @returns {Object} Fetch methods and loading state
 */
export const useFetch = () => {
  const [pendingRequests, setPendingRequests] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const requestIdRef = useRef(0);
  const { start, done } = useNProgress();

  const addRequest = useCallback((requestId) => {
    setPendingRequests(prev => {
      const newSet = new Set(prev);
      newSet.add(requestId);
      return newSet;
    });
    setIsLoading(true);
    start();
  }, [start]);

  const removeRequest = useCallback((requestId) => {
    setPendingRequests(prev => {
      const newSet = new Set(prev);
      newSet.delete(requestId);
      if (newSet.size === 0) {
        setIsLoading(false);
        done();
      }
      return newSet;
    });
  }, [done]);

  /**
   * Enhanced fetch with automatic loading management
   * 
   * @param {string} url - Request URL
   * @param {Object} options - Fetch options
   * @param {Object} config - Additional configuration
   * @param {boolean} config.showProgress - Whether to show progress bar (default: true)
   * @param {Function} config.onProgress - Progress callback for uploads
   * @returns {Promise} Fetch response
   */
  const fetchWithLoading = useCallback(async (url, options = {}, config = {}) => {
    const { showProgress = true, onProgress } = config;
    const requestId = ++requestIdRef.current;

    if (showProgress) {
      addRequest(requestId);
    }

    try {
      // Get auth token for authenticated requests
      const token = localStorage.getItem('authToken');
      
      // Default headers
      const defaultHeaders = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      // Add auth header if token exists
      if (token) {
        defaultHeaders.Authorization = `Bearer ${token}`;
      }

      // If body is FormData, remove Content-Type to let browser set boundary
      if (options.body instanceof FormData) {
        delete defaultHeaders['Content-Type'];
      }

      const fetchOptions = {
        credentials: 'include', // Always include credentials for session-based auth
        ...options,
        headers: defaultHeaders
      };

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    } finally {
      if (showProgress) {
        removeRequest(requestId);
      }
    }
  }, [addRequest, removeRequest]);

  /**
   * GET request helper
   */
  const get = useCallback((url, config = {}) => {
    return fetchWithLoading(url, { method: 'GET' }, config);
  }, [fetchWithLoading]);

  /**
   * POST request helper
   */
  const post = useCallback((url, data, config = {}) => {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return fetchWithLoading(url, { 
      method: 'POST', 
      body 
    }, config);
  }, [fetchWithLoading]);

  /**
   * PUT request helper
   */
  const put = useCallback((url, data, config = {}) => {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return fetchWithLoading(url, { 
      method: 'PUT', 
      body 
    }, config);
  }, [fetchWithLoading]);

  /**
   * DELETE request helper
   */
  const del = useCallback((url, config = {}) => {
    return fetchWithLoading(url, { method: 'DELETE' }, config);
  }, [fetchWithLoading]);

  return {
    fetchWithLoading,
    get,
    post,
    put,
    delete: del,
    isLoading,
    pendingRequestsCount: pendingRequests.size,
    hasPendingRequests: pendingRequests.size > 0
  };
};

export default useFetch;