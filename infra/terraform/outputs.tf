#output "cloud_run_url" {
#  value       = module.cloud_run.service_url
#  description = "Cloud Run service URL"
#}

output "artifact_registry_url" {
  value       = module.artifact_registry.repository_url
  description = "Artifact Registry Docker repository URL"
}

#output "load_balancer_ip" {
#  value       = var.enable_load_balancer ? module.load_balancer[0].ip_address : null
#  description = "Load balancer global IP address"
#}

#output "secret_ids" {
#  value       = module.secret_manager.secret_ids
#  description = "Secret Manager secret IDs"
#  sensitive   = true
#}
