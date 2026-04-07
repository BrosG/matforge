# ─── Enable Required APIs ───────────────────────────────────
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "redis.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "vpcaccess.googleapis.com",
    "compute.googleapis.com",
    "iam.googleapis.com",
  ])
  service            = each.value
  disable_on_destroy = false
}

# ─── Modules ────────────────────────────────────────────────
module "vpc" {
  source     = "./modules/vpc"
  project_id = var.project_id
  region     = var.region
  depends_on = [google_project_service.apis]
}

module "cloud_sql" {
  source      = "./modules/cloud-sql"
  project_id  = var.project_id
  region      = var.region
  network_id  = module.vpc.network_id
  db_password = var.db_password
  environment = var.environment
}

module "memorystore" {
  source     = "./modules/memorystore"
  project_id = var.project_id
  region     = var.region
  network_id = module.vpc.network_id
}

module "artifact_registry" {
  source     = "./modules/artifact-registry"
  project_id = var.project_id
  region     = var.region
  depends_on = [google_project_service.apis]
}

module "iam" {
  source     = "./modules/iam"
  project_id = var.project_id
  depends_on = [google_project_service.apis]
}

module "cloud_run_api" {
  source                = "./modules/cloud-run"
  project_id            = var.project_id
  region                = var.region
  service_name          = "matforge-api-${var.environment}"
  image                 = "${var.region}-docker.pkg.dev/${var.project_id}/matforge/api:latest"
  vpc_connector_id      = module.vpc.connector_id
  service_account_email = module.iam.api_sa_email
  port                  = 8000
  memory                = "1Gi"
  cpu                   = "1"
  min_instances         = 0
  max_instances         = 10
  allow_unauthenticated = true
}

module "cloud_run_worker" {
  source                = "./modules/cloud-run"
  project_id            = var.project_id
  region                = var.region
  service_name          = "matforge-worker-${var.environment}"
  image                 = "${var.region}-docker.pkg.dev/${var.project_id}/matforge/worker:latest"
  vpc_connector_id      = module.vpc.connector_id
  service_account_email = module.iam.api_sa_email
  port                  = 8080
  memory                = "2Gi"
  cpu                   = "2"
  min_instances         = 1
  max_instances         = 5
  allow_unauthenticated = false
  no_cpu_throttling     = true
}

module "cloud_run_frontend" {
  source                = "./modules/cloud-run"
  project_id            = var.project_id
  region                = var.region
  service_name          = "matforge-frontend-${var.environment}"
  image                 = "${var.region}-docker.pkg.dev/${var.project_id}/matforge/frontend:latest"
  vpc_connector_id      = module.vpc.connector_id
  service_account_email = module.iam.frontend_sa_email
  port                  = 3000
  memory                = "512Mi"
  cpu                   = "1"
  min_instances         = 0
  max_instances         = 5
  allow_unauthenticated = true
}
