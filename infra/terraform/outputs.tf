output "cloud_sql_connection_name" {
  value       = module.cloud_sql.connection_name
  description = "Cloud SQL instance connection name"
}

output "cloud_sql_private_ip" {
  value       = module.cloud_sql.private_ip
  description = "Cloud SQL private IP address"
}

output "redis_host" {
  value       = module.memorystore.host
  description = "Memorystore Redis host IP"
}

output "redis_port" {
  value       = module.memorystore.port
  description = "Memorystore Redis port"
}

output "api_url" {
  value       = module.cloud_run_api.url
  description = "Cloud Run API service URL"
}

output "frontend_url" {
  value       = module.cloud_run_frontend.url
  description = "Cloud Run frontend service URL"
}

output "artifact_registry_url" {
  value       = module.artifact_registry.repository_url
  description = "Artifact Registry Docker repository URL"
}

output "vpc_connector_id" {
  value       = module.vpc.connector_id
  description = "VPC Connector ID for Cloud Run"
}
