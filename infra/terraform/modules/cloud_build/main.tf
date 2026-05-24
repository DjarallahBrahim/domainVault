# Grant Cloud Build SA the required roles
locals {
  cb_sa = "${data.google_project.project.number}@cloudbuild.gserviceaccount.com"
}

data "google_project" "project" {
  project_id = var.project_id
}

# Cloud Run admin to deploy new revisions
resource "google_project_iam_member" "cb_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${local.cb_sa}"
}

# Artifact Registry to push images
resource "google_project_iam_member" "cb_ar_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${local.cb_sa}"
}

# Secret Manager to read secrets at build time
resource "google_project_iam_member" "cb_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${local.cb_sa}"
}

# Allow Cloud Build to act as cloudrun-sa when deploying
resource "google_service_account_iam_member" "cb_act_as_cloudrun_sa" {
  service_account_id = "projects/${var.project_id}/serviceAccounts/${var.cloud_run_sa}"
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${local.cb_sa}"
}

# Cloud Build trigger — fires on every push to main
resource "google_cloudbuild_trigger" "main" {
  name     = "${var.app_name}-deploy"
  project  = var.project_id
  location = var.region
  filename = "cloudbuild.yaml"

  github {
    owner = "DjarallahBrahim"
    name  = "domainVault"
    push {
      branch = "^main$"
    }
  }
  service_account = "projects/${var.project_id}/serviceAccounts/${local.cb_sa}"
}