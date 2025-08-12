/**
 * Utilitaires pour la gestion des fichiers
 */

export interface FileValidation {
  isValid: boolean;
  error?: string;
}

export class FileUtils {
  static readonly SUPPORTED_TYPES = [
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];

  static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  static readonly TYPE_LABELS = {
    'text/csv': 'CSV',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel (XLSX)',
    'application/vnd.ms-excel': 'Excel (XLS)',
  };

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static validateFile(file: { size?: number; mimeType?: string; name: string }): FileValidation {
    // Vérifier la taille
    if (file.size && file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `Le fichier est trop volumineux (${this.formatFileSize(file.size)}). Taille maximale: 50MB`
      };
    }

    // Vérifier le type
    if (file.mimeType && !this.SUPPORTED_TYPES.includes(file.mimeType)) {
      return {
        isValid: false,
        error: 'Type de fichier non supporté. Formats autorisés: CSV, Excel (.xlsx, .xls)'
      };
    }

    // Vérifier l'extension comme fallback
    const extension = file.name.toLowerCase().split('.').pop();
    const validExtensions = ['csv', 'xlsx', 'xls'];
    
    if (extension && !validExtensions.includes(extension)) {
      return {
        isValid: false,
        error: 'Extension de fichier non supportée. Formats autorisés: .csv, .xlsx, .xls'
      };
    }

    return { isValid: true };
  }

  static getFileTypeLabel(mimeType: string): string {
    return this.TYPE_LABELS[mimeType as keyof typeof this.TYPE_LABELS] || 'Inconnu';
  }

  static isCSV(file: { mimeType?: string; name: string }): boolean {
    return file.mimeType === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
  }

  static isExcel(file: { mimeType?: string; name: string }): boolean {
    const excelTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    return (file.mimeType && excelTypes.includes(file.mimeType)) ||
           Boolean(file.name.toLowerCase().match(/\.(xlsx|xls)$/));
  }

  static generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    
    return `${nameWithoutExt}_${timestamp}.${extension}`;
  }
}
