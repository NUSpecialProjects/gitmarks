# networking/variables.tf

# ------------------------------------------------
#  Local Variables
# ------------------------------------------------

variable "az_count" {
  description = "Number of AZs to cover in a given region"
  type        = number
  default     = "2"
}

# ------------------------------------------------
#  Global Variables
# ------------------------------------------------

variable "db_port" {
  description = "Database port"
  type        = number
}

variable "app_port" {
  description = "Application port"
  type        = number
}