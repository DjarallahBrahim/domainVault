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