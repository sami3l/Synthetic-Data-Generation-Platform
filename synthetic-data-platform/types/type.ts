export interface ParameterRange {
  min_value: number;
  max_value: number;
  step?: number;
  scale?: 'linear' | 'log';
}

export interface CategoricalParameter {
  choices: (string | number | number[])[];
}

export interface SearchSpace {
  // CTGAN Parameters
  epochs?: ParameterRange;
  batch_size?: CategoricalParameter;
  generator_lr?: ParameterRange;
  discriminator_lr?: ParameterRange;
  generator_decay?: ParameterRange;
  discriminator_decay?: ParameterRange;
  
  // TVAE Parameters
  compress_dims?: CategoricalParameter[];
  decompress_dims?: CategoricalParameter[];
  l2scale?: ParameterRange;
  loss_factor?: ParameterRange;
}

export interface OptimizationConfig {
  id?: number;
  request_id: number;
  optimization_type: 'bayesian' | 'grid' | 'random';
  max_evaluations: number;
  timeout_minutes: number;
  search_space: SearchSpace;
  acquisition_function?: 'expected_improvement' | 'upper_confidence_bound' | 'probability_improvement';
  status?: string;
  best_score?: number;
  total_evaluations?: number;
  created_at?: string;
  updated_at?: string;
}

export interface OptimizationTrial {
  id: number;
  trial_number: number;
  parameters: Record<string, any>;
  quality_score?: number;
  training_time?: number;
  memory_usage?: number;
  status: string;
  started_at: string;
  completed_at?: string;
}

