variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "service_name" {
  type = string
}

variable "image" {
  type = string
}

variable "vpc_connector_id" {
  type = string
}

variable "service_account_email" {
  type = string
}

variable "port" {
  type    = number
  default = 8080
}

variable "memory" {
  type    = string
  default = "512Mi"
}

variable "cpu" {
  type    = string
  default = "1"
}

variable "min_instances" {
  type    = number
  default = 0
}

variable "max_instances" {
  type    = number
  default = 5
}

variable "allow_unauthenticated" {
  type    = bool
  default = false
}

variable "no_cpu_throttling" {
  type    = bool
  default = false
}
