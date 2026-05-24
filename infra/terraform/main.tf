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