variable "project_id" {
  description = "GCP project ID"
  type        = string
  default     = "matforge-50499"
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Deployment environment (staging or production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be 'staging' or 'production'."
  }
}

variable "db_password" {
  description = "Cloud SQL database password"
  type        = string
  sensitive   = true
}

variable "domain" {
  description = "Primary domain"
  type        = string
  default     = "matcraft.ai"
}
