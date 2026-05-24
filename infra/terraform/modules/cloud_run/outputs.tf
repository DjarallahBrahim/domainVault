output "service_url" {
  value       = google_cloud_run_v2_service.domainvault.uri
  description = "Cloud Run service URL"
}

output "service_name" {
  value       = google_cloud_run_v2_service.domainvault.name
  description = "Cloud Run service name"
}
