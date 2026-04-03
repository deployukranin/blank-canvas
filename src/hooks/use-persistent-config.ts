/**
 * Hook for persistent configuration that syncs with database
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { loadConfig, saveConfig, type ConfigKey } from '@/lib/config-storage';
import { useToast } from '@/hooks/use-toast';

interface UsePersistentConfigOptions<T> {
  configKey: ConfigKey;
  defaultValue: T;
  localStorageKey?: string; // For migration from localStorage
  debounceMs?: number;
  storeId?: string | null;
}

export function usePersistentConfig<T>({
  configKey,
  defaultValue,
  localStorageKey,
  debounceMs = 1000,
  storeId,
}: UsePersistentConfigOptions<T>) {
  const [config, setConfigState] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingConfigRef = useRef<T | null>(null);
  const initialLoadDoneRef = useRef(false);

  // Load configuration from database on mount
  useEffect(() => {
    const loadFromDb = async () => {
      try {
        setIsLoading(true);
        
        // Try to load from database first
        const dbConfig = await loadConfig<T>(configKey, storeId);
        
        if (dbConfig) {
          // Merge with defaults to ensure new fields are present
          const merged = deepMerge(defaultValue, dbConfig as Partial<T>);
          setConfigState(merged);
          
          // Clear localStorage if migration was successful
          if (localStorageKey) {
            localStorage.removeItem(localStorageKey);
          }
        } else {
          // No config in DB, check localStorage for migration
          if (localStorageKey) {
            const localData = localStorage.getItem(localStorageKey);
            if (localData) {
              try {
                const parsed = JSON.parse(localData) as Partial<T>;
                const merged = deepMerge(defaultValue, parsed);
                setConfigState(merged);
                
                // Save to DB
                const saved = await saveConfig(configKey, merged, storeId);
                if (saved) {
                  localStorage.removeItem(localStorageKey);
                  console.log(`Migrated ${localStorageKey} to database`);
                }
              } catch (err) {
                console.error('Error parsing localStorage:', err);
                setConfigState(defaultValue);
              }
            } else {
              setConfigState(defaultValue);
            }
          } else {
            setConfigState(defaultValue);
          }
        }
      } catch (err) {
        console.error('Error loading config:', err);
        setConfigState(defaultValue);
      } finally {
        setIsLoading(false);
        initialLoadDoneRef.current = true;
      }
    };

    loadFromDb();
  }, [configKey, localStorageKey]);

  // Debounced save to database
  const debouncedSave = useCallback(async (newConfig: T) => {
    if (!initialLoadDoneRef.current) return;
    
    pendingConfigRef.current = newConfig;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const configToSave = pendingConfigRef.current;
      if (!configToSave) return;

      setIsSaving(true);
      try {
        const success = await saveConfig(configKey, configToSave);
        if (success) {
          setLastSaved(new Date());
        } else {
          console.error('Failed to save config');
        }
      } catch (err) {
        console.error('Error saving config:', err);
      } finally {
        setIsSaving(false);
        pendingConfigRef.current = null;
      }
    }, debounceMs);
  }, [configKey, debounceMs]);

  // Update config and trigger debounced save
  const setConfig = useCallback((updater: T | ((prev: T) => T)) => {
    setConfigState(prev => {
      const newConfig = typeof updater === 'function' ? (updater as (prev: T) => T)(prev) : updater;
      debouncedSave(newConfig);
      return newConfig;
    });
  }, [debouncedSave]);

  // Force immediate save
  const saveNow = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setIsSaving(true);
    try {
      const success = await saveConfig(configKey, config);
      if (success) {
        setLastSaved(new Date());
        toast({
          title: 'Configurações salvas!',
          description: 'Suas alterações foram salvas no servidor.',
        });
      } else {
        toast({
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar as configurações.',
          variant: 'destructive',
        });
      }
      return success;
    } catch (err) {
      console.error('Error saving config:', err);
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar as configurações.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [configKey, config, toast]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    config,
    setConfig,
    isLoading,
    isSaving,
    lastSaved,
    saveNow,
  };
}

// Deep merge utility - works with any object type
// PROTECTION: Empty arrays from server won't overwrite default arrays
function deepMerge<T>(target: T, source: Partial<T>): T {
  if (typeof target !== 'object' || target === null) {
    return source as T ?? target;
  }
  
  const result = { ...target } as T;
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = (target as Record<string, unknown>)[key];
      
      // PROTECTION: If source array is empty but target has items, keep target
      if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
        if (sourceValue.length === 0 && targetValue.length > 0) {
          // Keep the default array instead of overwriting with empty
          console.warn(`Keeping default array for key "${key}" instead of empty server value`);
          continue;
        }
        (result as Record<string, unknown>)[key] = sourceValue;
      } else if (
        sourceValue !== null &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue !== null &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        (result as Record<string, unknown>)[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        );
      } else if (sourceValue !== undefined) {
        (result as Record<string, unknown>)[key] = sourceValue;
      }
    }
  }
  
  return result;
}
