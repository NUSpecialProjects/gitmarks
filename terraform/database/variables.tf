# database/variables.tf

# ------------------------------------------------
#  Local Variables
# ------------------------------------------------

variable "rds_instance_name" {
  description = "RDS instance name"
  type        = string
  default     = "gitmarks-rds-instance"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "khouryclassroomdb"
}

variable "db_user" {
  description = "Database username"
  type        = string
  default     = "db_user"
}

variable "db_password" {
  description = "Database password"
  type        = string
  default     = "db_password"
}

# ------------------------------------------------
#  Global Variables
# ------------------------------------------------

variable "db_port" {
  description = "Database port"
  type        = number
}

variable "db_subnet_name" {
  description = "Database subnet name"
  type        = string
}

variable "rds_sg_id" {
  description = "RDS security group ID"
  type        = string
}

variable "aws_account_id" {
  description = "AWS account ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnets"
  type        = list(any)
}

variable "lambda_sg_id" {
  description = "Security group ID for Lambda functions"
  type        = string
}

variable "ecs_cluster_name" {
  description = "ECS cluster name"
  type        = string
}

variable "ecs_service_name" {
  description = "ECS service name"
  type        = string
}