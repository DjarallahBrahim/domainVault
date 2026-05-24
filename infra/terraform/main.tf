# infra/terraform/main.tf
module "artifact_registry" {
  source   = "./modules/artifact_registry"
  app_name = var.app_name
  region   = var.region
}