output "dns_records" {
  description = "Add these records at Spaceship"
  value       = google_cloud_run_domain_mapping.vault.status[0].resource_records
}