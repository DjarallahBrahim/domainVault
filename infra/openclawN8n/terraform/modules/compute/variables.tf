variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "zone" {
  type = string
}

variable "name" {
  description = "App name, used to prefix all resource names"
  type        = string
}

variable "machine_type" {
  type    = string
  default = "e2-small"
}

variable "disk_image" {
  type    = string
  default = "debian-cloud/debian-12"
}

variable "disk_size_gb" {
  type    = number
  default = 20
}

variable "subnetwork_id" {
  type = string
}

variable "ssh_public_key_path" {
  type = string
}

variable "tags" {
  type    = list(string)
  default = ["lab-instance"]
}