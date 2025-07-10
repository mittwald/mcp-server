#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
from urllib.parse import urljoin, urlparse

# OpenSearch configuration
OPENSEARCH_URL = "https://opensearch.p-b86jyk.project.space"
INDEX_NAME = "deployment-guides"

# URLs to crawl
URLS = [
    "https://developer.mittwald.de/docs/v2/platform/deployment/container-actions/",
    "https://developer.mittwald.de/docs/v2/platform/deployment/deployer/",
    "https://developer.mittwald.de/docs/v2/platform/deployment/terraform/",
    "https://developer.mittwald.de/docs/v2/platform/deployment/typo3surf/"
]

def extract_text_content(url):
    """Extract text content from a URL"""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Try to find the main content area
        main_content = soup.find('main') or soup.find('article') or soup.find('div', class_='content') or soup.body
        
        if main_content:
            # Get text and clean it up
            text = main_content.get_text(separator=' ', strip=True)
            # Remove excessive whitespace
            text = ' '.join(text.split())
            
            # Extract title
            title = None
            h1 = soup.find('h1')
            if h1:
                title = h1.get_text(strip=True)
            elif soup.title:
                title = soup.title.get_text(strip=True)
            
            return {
                'url': url,
                'title': title or urlparse(url).path,
                'content': text,
                'timestamp': datetime.utcnow().isoformat()
            }
        else:
            return None
            
    except Exception as e:
        print(f"Error crawling {url}: {str(e)}")
        return None

def create_index():
    """Create the OpenSearch index with appropriate mappings"""
    mapping = {
        "mappings": {
            "properties": {
                "url": {"type": "keyword"},
                "title": {"type": "text"},
                "content": {"type": "text"},
                "timestamp": {"type": "date"}
            }
        }
    }
    
    try:
        # Check if index exists
        response = requests.head(f"{OPENSEARCH_URL}/{INDEX_NAME}", verify=False)
        if response.status_code == 200:
            print(f"Index {INDEX_NAME} already exists, deleting...")
            requests.delete(f"{OPENSEARCH_URL}/{INDEX_NAME}", verify=False)
        
        # Create index
        response = requests.put(
            f"{OPENSEARCH_URL}/{INDEX_NAME}",
            json=mapping,
            headers={"Content-Type": "application/json"},
            verify=False
        )
        
        if response.status_code in [200, 201]:
            print(f"Successfully created index: {INDEX_NAME}")
        else:
            print(f"Failed to create index: {response.text}")
            
    except Exception as e:
        print(f"Error creating index: {str(e)}")

def index_document(doc, doc_id):
    """Index a document into OpenSearch"""
    try:
        response = requests.put(
            f"{OPENSEARCH_URL}/{INDEX_NAME}/_doc/{doc_id}",
            json=doc,
            headers={"Content-Type": "application/json"},
            verify=False
        )
        
        if response.status_code in [200, 201]:
            print(f"Successfully indexed: {doc['title']}")
        else:
            print(f"Failed to index document: {response.text}")
            
    except Exception as e:
        print(f"Error indexing document: {str(e)}")

def main():
    print("Starting crawl and index process...")
    
    # Disable SSL warnings since we're using self-signed certs
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    # Create index
    create_index()
    
    # Crawl and index each URL
    for i, url in enumerate(URLS):
        print(f"\nCrawling: {url}")
        doc = extract_text_content(url)
        
        if doc:
            index_document(doc, f"doc-{i+1}")
        else:
            print(f"Failed to extract content from: {url}")
    
    print("\nCrawl and index process completed!")
    
    # Refresh the index to make documents searchable immediately
    requests.post(f"{OPENSEARCH_URL}/{INDEX_NAME}/_refresh", verify=False)

if __name__ == "__main__":
    main()