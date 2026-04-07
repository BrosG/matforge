resource "google_sql_database_instance" "main" {
  name             = "matforge-db"
  project          = var.project_id
  region           = var.region
  database_version = "POSTGRES_15"

  settings {
    tier              = "db-f1-micro"
    availability_type = "ZONAL"

    disk_autoresize = true
    disk_size       = 10
    disk_type       = "PD_SSD"

    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = var.network_id
      enable_private_path_for_google_cloud_services = true
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = true
      backup_retention_settings {
        retained_backups = 7
      }
    }

    maintenance_window {
      day  = 7 # Sunday
      hour = 4
    }
  }

  deletion_protection = true
}

resource "google_sql_database" "db" {
  name     = "matforge_${var.environment}"
  project  = var.project_id
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "main" {
  name     = "matforge"
  project  = var.project_id
  instance = google_sql_database_instance.main.name
  password = var.db_password
}
