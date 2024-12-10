##################################################
# Step Function Policies
##################################################
resource "aws_iam_role_policy_attachment" "lambda_step_function_policy_attachment" {
  role       = aws_iam_role.lambda_step_function_execution_role.name
  policy_arn = aws_iam_policy.lambda_step_function_policy.arn
}

resource "aws_iam_role" "lambda_step_function_execution_role" {
  name = "dv_lambda_step_function_execution_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_step_function_policy" {
  name        = "dv_lambda_step_function_policy"
  description = "Policy to allow Lambda to access Step Function"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        "Effect" : "Allow",
        "Action" : [
          "logs:*"
        ],
        "Resource" : "arn:aws:logs:*:*:*"
      },
      {
        "Effect" : "Allow",
        "Action" : [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "s3-object-lambda:WriteGetObjectResponse"
        ],
        "Resource" : "*"
      },
      {
        "Effect" : "Allow",
        "Action" : [
          "textract:StartDocumentAnalysis",
          "textract:GetDocumentAnalysis"
        ],
        "Resource" : "*"
      },
      {
        Action = [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListObjects"
        ],
        Effect = "Allow",
        Resource = [
          aws_s3_bucket.landing_bucket.arn,
          "${aws_s3_bucket.landing_bucket.arn}/*",
          aws_s3_bucket.metadata_bucket.arn,
          "${aws_s3_bucket.metadata_bucket.arn}/*",
          aws_s3_bucket.analysis_bucket.arn,
          "${aws_s3_bucket.analysis_bucket.arn}/*",
        ]
      },
    ]
  })
}