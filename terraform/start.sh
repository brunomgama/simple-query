#!/bin/bash

# Create a directory for dependencies
#mkdir -p python

# Install dependencies to the 'python' directory
#python3 -m pip install -r lambda/requirements.txt -t python/

# Navigate to the directory
cd "/Users/brunogama/Documents/ai-data-processor/terraform/lambda" || exit

# Remove existing zip file if it exists
rm -f start_execution.zip
#rm -f package.zip

# Create a new zip file containing the convert_analysis.py
zip -r start_execution.zip start_execution.py
#zip -r package.zip ../python/

# Output success message
echo "start_execution.zip created successfully!"

cd ..

terraform plan

echo "Plan executed successfully!"

terraform apply -auto-approve

echo "Apply executed successfully!"
