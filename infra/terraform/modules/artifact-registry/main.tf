resource "google_artifact_registry_repository" "docker" {
  repository_id = "matforge"
  project       = var.project_id
  location      = var.region
  format        = "DOCKER"
  description   = "MatForge Docker images"

  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions {
      keep_count = 10
    }
  }
}
