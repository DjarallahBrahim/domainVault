# create our repository from module/artifact_registry
module "artifact_registry" {
  source   = "./modules/artifact_registry"
  app_name = var.app_name
  region   = var.region
}

# create our secret manager from module/secret_manager
module "secret_manager" {
  source   = "./modules/secret_manager"
  secrets = var.secrets

}

module "cloud_run" {
  source = "./modules/cloud_run"

  project_id = var.project_id
  region     = var.region

  service_name = var.service_name
  image        = var.image

  cloud_run_service_account = var.cloud_run_service_account

  secrets = module.secret_manager.secret_names
}

# create our cloud_build module/cloud_build
module "cloud_build" {
  source       = "./modules/cloud_build"
  project_id   = var.project_id
  region       = var.region
  app_name     = var.app_name
  cloud_run_sa = var.cloud_run_service_account
  cloud_build_service_account = var.cloud_build_service_account

}