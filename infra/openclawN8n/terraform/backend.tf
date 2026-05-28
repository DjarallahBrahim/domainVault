provider "google" {
  project                     = var.project_id
  region                      = var.region
  impersonate_service_account = "terraform@${var.project_id}.iam.gserviceaccount.com"
}


terraform {
  backend "gcs" {
    bucket = "openclawn8n-tfstate"
    prefix = "terraform/state"
  }
}