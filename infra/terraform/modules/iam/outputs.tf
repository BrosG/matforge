output "github_actions_sa_email" {
  value = google_service_account.github_actions.email
}

output "api_sa_email" {
  value = google_service_account.api.email
}

output "frontend_sa_email" {
  value = google_service_account.frontend.email
}

output "wif_provider" {
  value = google_iam_workload_identity_pool_provider.github.name
}
