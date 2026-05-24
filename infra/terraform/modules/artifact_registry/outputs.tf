output "repository_id" {
  value = google_artifact_registry_repository.my-repo.repository_id
}

output "repository_url" {
  value = "${var.region}-docker.pkg.dev/${google_artifact_registry_repository.my-repo.project}/${google_artifact_registry_repository.my-repo.repository_id}"
}
