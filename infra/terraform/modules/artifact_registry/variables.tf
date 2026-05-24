variable "repository_id" {
  type    = string
  default = "domainvault"
}

variable "region" {
  type = string
}

variable "app_name" {
  description = "Application name (used as prefix for resources)"
  type        = string
}
