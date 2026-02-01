import React from 'react';

export type CellType = 'code' | 'markdown';
export type Tone = 'Academic' | 'Beginner-friendly' | 'Enterprise' | 'Concise';

export interface NotebookCell {
  id: string; // Unique identifier for drag-and-drop
  cell_type: CellType;
  metadata: Record<string, unknown>;
  source: string[]; // Jupyter expects an array of strings (lines)
  execution_count?: number | null;
  outputs?: unknown[];
}

export interface NotebookStructure {
  cells: NotebookCell[];
  metadata: {
    kernelspec: {
      display_name: string;
      language: string;
      name: string;
    };
    language_info: {
      codemirror_mode: {
        name: string;
        version: number;
      };
      file_extension: string;
      mimetype: string;
      name: string;
      nbconvert_exporter: string;
      pygments_lexer: string;
      version: string;
    };
  };
  nbformat: number;
  nbformat_minor: number;
}

export interface ProcessingStatus {
  step: 'idle' | 'reading' | 'analyzing' | 'complete' | 'error';
  message?: string | React.ReactNode;
  errorType?: 'api_key' | 'network' | 'content' | 'unknown';
}