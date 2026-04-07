output "network_id" {
  value = google_compute_network.main.id
}

output "network_name" {
  value = google_compute_network.main.name
}

output "connector_id" {
  value = google_vpc_access_connector.connector.id
}
