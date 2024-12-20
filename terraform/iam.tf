# iam.tf

data "aws_region" "current" {}

# ------------------------------------------------
#  GitHub Actions Deployment
# ------------------------------------------------

# Verify the GitHub Actions OIDC provider
resource "aws_iam_role" "github_actions_deploy_role" {
  name = "github-actions-deploy-role"

  # Trust policy for GitHub OIDC
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        "Effect" : "Allow",
        "Principal" : {
          "Federated" : "arn:aws:iam::058264409130:oidc-provider/token.actions.githubusercontent.com"
        },
        "Action" : "sts:AssumeRoleWithWebIdentity",
        "Condition" : {
          "StringEquals" : {
            "token.actions.githubusercontent.com:aud" : "sts.amazonaws.com"
          },
          "StringLike" : {
            "token.actions.githubusercontent.com:sub" : "repo:NUSpecialProjects/gitmarks:*"
          }
        }
      }
    ]
  })
}

# Policies to allow GitHub Actions to fully deploy the application
resource "aws_iam_policy" "github_actions_deply_policy" {
  name = "github-actions-deploy-policy"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        "Effect" : "Allow",
        "Action" : [
          "iam:GetRole",
          "iam:GetPolicy",
          "iam:GetPolicyVersion",
          "iam:ListAttachedRolePolicies",
          "iam:ListPolicies",
          "iam:ListPolicyVersions",
          "iam:ListRoles",
          "iam:ListRolePolicies",
          "iam:PassRole",

          "acm:*",
          "application-autoscaling:*",
          "cloudwatch:*",
          "cloudfront:*",
          "dynamodb:*",
          "ec2:*",
          "ecr:*",
          "ecs:*",
          "elasticloadbalancing:*",
          "lambda:*",
          "logs:*",
          "rds:*",
          "route53:*",
          "s3:*",
          "secretsmanager:*",
        ]
        "Resource" : "*"
      },
    ]
  })
}

# Attach the GitHub Actions deploy policy to the role
resource "aws_iam_role_policy_attachment" "github_actions_deploy_policy_attachment" {
  role       = aws_iam_role.github_actions_deploy_role.name
  policy_arn = aws_iam_policy.github_actions_deply_policy.arn
}