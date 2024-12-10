import json
import boto3
import csv
import io
import os
from collections import defaultdict

textract_client = boto3.client('textract')
s3_client = boto3.client('s3')

ANALYSIS_BUCKET_NAME = os.getenv('ANALYSIS_BUCKET_NAME')
METADATA_BUCKET_NAME = os.getenv('METADATA_BUCKET_NAME')

def fetch_metadata(bucket_name, object_key):
    """
    Fetch metadata from S3 and parse it into a dictionary.
    """
    response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
    metadata_content = response['Body'].read().decode('utf-8')
    return json.loads(metadata_content)


def extract_key_value_relationships(keys, values, blocks):
    kv_pairs = defaultdict(list)
    for key_id, key_block in keys.items():
        value_block = find_value_block(key_block, values)
        key_text = extract_text(key_block, blocks)
        value_text = extract_text(value_block, blocks) if value_block else ""
        kv_pairs[key_text].append(value_text)
    return kv_pairs


def find_value_block(key_block, value_map):
    for relationship in key_block.get('Relationships', []):
        if relationship['Type'] == 'VALUE':
            for value_id in relationship['Ids']:
                return value_map.get(value_id)
    return None


def extract_text(block, blocks_map):
    """
    Extracts text from a given block.
    Handles different block types including 'WORD', 'SELECTION_ELEMENT',
    and accounts for 'QUERY_RESULT' block peculiarities.
    """
    text = ''

    if block.get('BlockType') == 'QUERY_RESULT':
        text = block.get('Text', '')
    else:
        for relationship in block.get('Relationships', []):
            if relationship['Type'] == 'CHILD':
                for child_id in relationship['Ids']:
                    child = blocks_map.get(child_id)
                    if child:
                        if child['BlockType'] == 'WORD':
                            text += child['Text'] + ' '
                        elif (child['BlockType'] == 'SELECTION_ELEMENT' and
                              child['SelectionStatus'] == 'SELECTED'):
                            text += 'X '

    return text.strip()


def analyze_document(bucket_name, object_key):
    # Fetch metadata from the specified location
    metadata_bucket = METADATA_BUCKET_NAME
    metadata_key = f"{object_key.replace(".pdf", "")}/metadata.json"
    metadata = fetch_metadata(metadata_bucket, metadata_key)

    # Extract queries from metadata
    queries_config = [
        {"Text": details["Text"], "Alias": alias, 'Pages': ['*']}
        for alias, details in metadata.get("query", {}).items()
    ]

    return textract_client.start_document_analysis(
        DocumentLocation={'S3Object': {'Bucket': bucket_name, 'Name': object_key}},
        QueriesConfig={"Queries": queries_config},
        FeatureTypes=['FORMS', 'TABLES', 'QUERIES']
    )


def poll_job_execution(job_id):
    while (job_status := textract_client.get_document_analysis(JobId=job_id)['JobStatus']) == "IN_PROGRESS":
        pass
    if job_status == "FAILED":
        raise Exception("Failed to get analysis")
    return job_status


def fetch_all_blocks(job_id):
    blocks = []
    response = textract_client.get_document_analysis(JobId=job_id)
    while True:
        blocks.extend(response.get('Blocks', []))
        if not (next_token := response.get("NextToken")):
            break
        response = textract_client.get_document_analysis(JobId=job_id, NextToken=next_token)
    return blocks


def extract_queries_and_answers(blocks, block_map):
    """Extract QUERY and QUERY_RESULT pairs."""
    query_results = []

    for block in blocks:
        if block.get('BlockType') == 'QUERY':
            query_text = block.get('Query', {}).get('Text', '')
            answer = ""

            for relationship in block.get('Relationships', []):
                if relationship['Type'] == 'ANSWER':
                    for answer_id in relationship['Ids']:
                        answer_block = block_map.get(answer_id)
                        if answer_block and answer_block.get('BlockType') == 'QUERY_RESULT':
                            answer = extract_text(answer_block, block_map).strip()
                            break
            query_results.append((query_text, answer))

    return query_results


def write_results_to_csv(object_key, all_blocks, kvs, query_results, block_map):
    output_key = f"{object_key.rsplit('/', 1)[-1].split('.')[0]}/{object_key.rsplit('/', 1)[-1].split('.')[0]}_output.csv"
    csv_output = io.StringIO()
    csv_writer = csv.writer(csv_output, quoting=csv.QUOTE_MINIMAL)
    csv_writer.writerow(['Page', 'BlockType', 'Text', 'Confidence', 'BoundingBox_Left', 'BoundingBox_Top',
                         'BoundingBox_Width', 'BoundingBox_Height', 'ExtractedKey', 'ExtractedValue',
                         'QueryQuestion', 'QueryAnswer'])

    for block in all_blocks:
        text = block.get('Text', '').replace(',', '') or ''
        bbox = block.get('Geometry', {}).get('BoundingBox', {})
        key, value = "", ""
        if block['BlockType'] == 'KEY_VALUE_SET' and 'KEY' in block.get('EntityTypes', []):
            key = extract_text(block, block_map).replace(',', ' ')
            value_block = find_value_block(block, kvs)
            if value_block:
                value = extract_text(value_block, block_map).replace(',', '')

        csv_writer.writerow([
            block.get('Page', ''), block.get('BlockType', ''), text, block.get('Confidence', ''),
            bbox.get('Left', ''), bbox.get('Top', ''), bbox.get('Width', ''), bbox.get('Height', ''), key, value, '', ''
        ])

    for query, answer in query_results:
        if answer:
            csv_writer.writerow(['', 'QUERY', '', '', '', '', '', '', '', '', query, answer])
    csv_output.seek(0)

    s3_client.put_object(
        Bucket=ANALYSIS_BUCKET_NAME,
        Key=output_key,
        Body=csv_output.getvalue().encode('utf-8-sig'),
        ContentType='text/csv',
        ContentEncoding='utf-8-sig'
    )


def lambda_handler(event, context):
    try:
        bucket_name = event['Records'][0]['s3']['bucket']['name']
        object_key = event['Records'][0]['s3']['object']['key']

        job_id = analyze_document(bucket_name, object_key)['JobId']
        poll_job_execution(job_id)
        all_blocks = fetch_all_blocks(job_id)
        block_map = {block['Id']: block for block in all_blocks}

        queries_and_answers = extract_queries_and_answers(all_blocks, block_map)
        key_map, value_map = {}, {}
        for block in all_blocks:
            if block['BlockType'] == "KEY_VALUE_SET":
                if 'KEY' in block.get('EntityTypes', []):
                    key_map[block['Id']] = block
                else:
                    value_map[block['Id']] = block
        kvs = extract_key_value_relationships(key_map, value_map, block_map)

        write_results_to_csv(object_key, all_blocks, kvs, queries_and_answers, block_map)

        return {'statusCode': 200, 'body': json.dumps({"message": "Step Function triggered successfully"})}
    except Exception as error:
        return {'statusCode': 500,
                'body': json.dumps({"message": "Failed to trigger Step Function", "error": str(error)})}
