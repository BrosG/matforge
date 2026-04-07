export interface Template {
  id: string;
  name: string;
  description: string | null;
  domain: string;
  definition_yaml: string;
  author_id: string;
  author_name: string | null;
  likes_count: number;
  forks_count: number;
  is_official: boolean;
  tags: string[];
  created_at: string;
  updated_at: string | null;
  liked_by_me: boolean;
}

export interface TemplateListResponse {
  templates: Template[];
  total: number;
  page: number;
  limit: number;
}

export interface TemplateForkResponse {
  campaign_id: string;
  template_id: string;
}
