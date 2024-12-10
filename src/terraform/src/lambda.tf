locals {
  start_execution = "dv_start_execution"
}

##################################################
# Start Execution Lambda
##################################################
resource "aws_lambda_function" "start_execution_lambda" {
  filename      = "${path.module}/../lambda/start_execution.zip"
  function_name = local.start_execution
  role          = aws_iam_role.lambda_step_function_execution_role.arn
  handler       = "start_execution.lambda_handler"
  runtime       = "python3.12"
  timeout       = 900

  environment {
    variables = {
      ANALYSIS_BUCKET_NAME = aws_s3_bucket.analysis_bucket.bucket
      METADATA_BUCKET_NAME = aws_s3_bucket.metadata_bucket.bucket
    }
  }
}