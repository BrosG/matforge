variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "network_id" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "environment" {
  type = string
}
