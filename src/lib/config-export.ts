/**
 * Utilitários para exportar e importar configurações do WhiteLabel
 */

import { WhiteLabelConfig } from '@/contexts/WhiteLabelContext';

const CONFIG_STORAGE_KEY = 'whitelabel-config';
const EXPORT_VERSION = '1.0.0';

interface ExportedConfig {
  version: string;
  exportedAt: string;
  config: WhiteLabelConfig;
}

/**
 * Exporta as configurações atuais para um arquivo JSON
 */
export function exportConfig(config: WhiteLabelConfig): void {
  const exportData: ExportedConfig = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    config,
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `whitelabel-config-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Importa configurações de um arquivo JSON
 */
export function importConfig(file: File): Promise<WhiteLabelConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content) as ExportedConfig;

        // Validate structure
        if (!data.config) {
          throw new Error('Arquivo inválido: configuração não encontrada');
        }

        // Check version compatibility
        if (data.version && data.version !== EXPORT_VERSION) {
          console.warn(`Versão diferente detectada: ${data.version} (atual: ${EXPORT_VERSION})`);
        }

        resolve(data.config);
      } catch (error) {
        reject(new Error('Erro ao processar arquivo: formato inválido'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsText(file);
  });
}

/**
 * Salva configurações no localStorage
 */
export function saveConfigToStorage(config: WhiteLabelConfig): void {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}

/**
 * Carrega configurações do localStorage
 */
export function loadConfigFromStorage(): WhiteLabelConfig | null {
  const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as WhiteLabelConfig;
  } catch {
    return null;
  }
}

/**
 * Remove todas as configurações do localStorage
 */
export function clearConfigStorage(): void {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
  localStorage.removeItem('setup_completed');
}

/**
 * Cria um backup rápido das configurações atuais
 */
export function createBackup(config: WhiteLabelConfig): string {
  const backup = {
    timestamp: Date.now(),
    config,
  };
  const backupKey = `whitelabel-backup-${Date.now()}`;
  localStorage.setItem(backupKey, JSON.stringify(backup));
  return backupKey;
}

/**
 * Lista todos os backups disponíveis
 */
export function listBackups(): Array<{ key: string; timestamp: number }> {
  const backups: Array<{ key: string; timestamp: number }> = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('whitelabel-backup-')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        backups.push({ key, timestamp: data.timestamp || 0 });
      } catch {
        // Ignore invalid backups
      }
    }
  }

  return backups.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Restaura um backup específico
 */
export function restoreBackup(backupKey: string): WhiteLabelConfig | null {
  const data = localStorage.getItem(backupKey);
  if (!data) return null;

  try {
    const backup = JSON.parse(data);
    return backup.config as WhiteLabelConfig;
  } catch {
    return null;
  }
}

/**
 * Remove um backup específico
 */
export function deleteBackup(backupKey: string): void {
  localStorage.removeItem(backupKey);
}

/**
 * Remove backups antigos (mantém os últimos N)
 */
export function cleanOldBackups(keepCount: number = 5): void {
  const backups = listBackups();
  const toDelete = backups.slice(keepCount);
  
  for (const backup of toDelete) {
    deleteBackup(backup.key);
  }
}
