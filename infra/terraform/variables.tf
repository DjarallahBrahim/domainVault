variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "app_name" {
  description = "Application name (used as prefix for resources)"
  type        = string
  default     = "domainvault"
}
# -----------------------------------------------------------------------------
# Artifcat registry
# -----------------------------------------------------------------------------
variable "repository_id" {
  type    = string
  default = "domainvault"
}
# -----------------------------------------------------------------------------
# Cloud Run
# -----------------------------------------------------------------------------
variable "image" {
  description = "Container image to deploy (Artifact Registry URL)"
  type        = string
}

variable "service_name" {
  type    = string
  default = "domainvault"
}


variable "container_port" {
  type    = number
  default = 3000
}

variable "cpu_limit" {
  type    = string
  default = "1"
}

variable "memory_limit" {
  type    = string
  default = "512Mi"
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
  default = true
}

variable "cloud_run_service_account" {
  description = "Service account email for Cloud Run"
  type        = string
}

variable "env_vars" {
  description = "Non-secret environment variables"
  type        = map(string)
  default     = {}
}

# -----------------------------------------------------------------------------
# Secrets
# -----------------------------------------------------------------------------
variable "secrets" {
  description = "Map of secret name to secret value (will be stored in Secret Manager)"
  type        = map(string)
  default     = {}
}

# -----------------------------------------------------------------------------
# Cloud Build
# -----------------------------------------------------------------------------
variable "enable_cloud_build" {
  type    = bool
  default = true
}

variable "cloudbuild_repo_resource_name" {
  description = "Full resource name for the Cloud Build repo connection"
  type        = string
  default     = ""
}

variable "cloudbuild_branch" {
  type    = string
  default = "^main$"
}

variable "cloudbuild_sa_email" {
  description = "Cloud Build service account email"
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# Load Balancer
# -----------------------------------------------------------------------------
variable "enable_load_balancer" {
  type    = bool
  default = false
}

variable "domain" {
  description = "Custom domain for the load balancer"
  type        = string
  default     = ""
}
