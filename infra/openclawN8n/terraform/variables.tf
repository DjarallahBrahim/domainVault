variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "europe-west1"
}

variable "zone" {
  description = "GCP zone"
  type        = string
  default     = "europe-west1-b"
}

variable "credentials_file" {
  description = "Path to the service account JSON key"
  type        = string
}

variable "ssh_public_key_path" {
  description = "Path to the Ansible SSH public key"
  type        = string
  default     = "~/.ssh/gcp_ansible.pub"
}

variable "machine_type" {
  description = "GCE machine type"
  type        = string
  default     = "e2-small"
}