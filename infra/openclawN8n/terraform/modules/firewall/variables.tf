variable "network_name" {
  description = "VPC network name to attach rules to"
  type        = string
}

variable "ssh_source_ranges" {
  description = "CIDR ranges allowed to SSH — restrict to your IP in prod"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "app_ports" {
  description = "Extra TCP ports to open (app-specific)"
  type        = list(string)
  default     = []
}