resource "google_redis_instance" "main" {
  name           = "matforge-redis"
  project        = var.project_id
  region         = var.region
  tier           = "BASIC"
  memory_size_gb = 1
  redis_version  = "REDIS_7_0"

  authorized_network = var.network_id

  redis_configs = {
    maxmemory-policy = "allkeys-lru"
  }
}
