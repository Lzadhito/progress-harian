export interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface SubCategory {
  id: number;
  category_id: number;
  name: string;
  created_at: string;
  updated_at: string;
  category: Category;
}

export interface LatestProgress {
  id: number;
  task_id: number;
  value: number;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  sub_category_id: number;
  name: string;
  description: string;
  volume: number;
  unit: string;
  hds: string;
  total: string;
  price: string;
  weight: number;
  created_at: string;
  updated_at: string;
  sub_category?: SubCategory;
  get_latest_progress?: LatestProgress;
}
