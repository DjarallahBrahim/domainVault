variable "secrets" {
  type        = map(string)
  description = "Map of secret name to secret value"
  default     = {}
}
