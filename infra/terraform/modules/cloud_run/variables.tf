variable "project_id" {
  type = string
}

variable "service_name" {
  type    = string
  default = "domainvault"
}

variable "region" {
  type = string
}

variable "image" {
  type = string
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

variable "ingress" {
  type    = string
  default = "INGRESS_TRAFFIC_ALL"
}

variable "cloud_run_service_account" {
  type = string
}

variable "env_vars" {
  type    = map(string)
  default = {}
}

variable "secrets" {
  type        = map(string)
  description = "Map of secret name to secret value"
  default     = {}
}

variable "depends_on_artifact" {
  type    = any
  default = null
}
