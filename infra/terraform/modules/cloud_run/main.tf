resource "google_cloud_run_v2_service" "domainvault" {
  name     = var.service_name
  location = var.region
  deletion_protection = false

  template {
    containers {
      image = var.image

      dynamic "env" {
        for_each = var.secrets

        content {
          name = env.key

          value_source {
            secret_key_ref {
              secret  = env.value
              version = "latest"
            }
          }
        }
      }

      resources {
        limits = {
          cpu    = var.cpu_limit
          memory = var.memory_limit
        }
      }

      ports {
        container_port = var.container_port
      }
    }

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    service_account = var.cloud_run_service_account
  }
}

# Make it publicly accessible
 resource "google_cloud_run_v2_service_iam_member" "public" {
   name     = google_cloud_run_v2_service.domainvault.name
   location = var.region
   role     = "roles/run.invoker"
   member   = "allUsers"
}