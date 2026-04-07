# ─── GitHub Actions CI/CD Service Account ───────────────────
resource "google_service_account" "github_actions" {
  account_id   = "github-actions"
  project      = var.project_id
  display_name = "GitHub Actions CI/CD"
}

resource "google_project_iam_member" "github_actions_roles" {
  for_each = toset([
    "roles/run.admin",
    "roles/artifactregistry.writer",
    "roles/secretmanager.secretAccessor",
    "roles/iam.serviceAccountUser",
  ])
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# ─── Workload Identity Federation ───────────────────────────
resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github-pool"
  project                   = var.project_id
  display_name              = "GitHub Actions Pool"
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  project                            = var.project_id
  display_name                       = "GitHub Provider"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# ─── API Runtime Service Account ───────────────────────────
resource "google_service_account" "api" {
  account_id   = "matforge-api"
  project      = var.project_id
  display_name = "MatForge API Runtime"
}

resource "google_project_iam_member" "api_roles" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/secretmanager.secretAccessor",
  ])
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.api.email}"
}

# ─── Frontend Runtime Service Account ──────────────────────
resource "google_service_account" "frontend" {
  account_id   = "matforge-frontend"
  project      = var.project_id
  display_name = "MatForge Frontend Runtime"
}

resource "google_project_iam_member" "frontend_roles" {
  for_each = toset([
    "roles/secretmanager.secretAccessor",
  ])
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.frontend.email}"
}
