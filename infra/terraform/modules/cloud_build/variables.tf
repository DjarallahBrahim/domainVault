variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "app_name" {
  type = string
}

variable "cloud_run_sa" {
  type        = string
  description = "The Cloud Run service account email"
}

variable "cloud_build_service_account" {
  type = string
}