resource "google_artifact_registry_repository" "my-repo" {
  repository_id = var.app_name
  location      = var.region
  description   = "Docker repository for internal projects"
  format        = "DOCKER"
}