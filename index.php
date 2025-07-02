<?php
// OpenSearch indexing script

$opensearchUrl = 'http://opensearch:9200';
$indexName = 'deployment-guides';

// Create index with mappings
$mapping = [
    'mappings' => [
        'properties' => [
            'title' => ['type' => 'text'],
            'url' => ['type' => 'keyword'],
            'content' => ['type' => 'text'],
            'category' => ['type' => 'keyword'],
            'timestamp' => ['type' => 'date']
        ]
    ]
];

// Create index
$ch = curl_init("$opensearchUrl/$indexName");
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($mapping));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$result = curl_exec($ch);
curl_close($ch);

echo "Index creation result: $result\n\n";

// Pages to index
$pages = [
    [
        'url' => 'https://developer.mittwald.de/docs/v2/platform/deployment/container-actions/',
        'title' => 'Container Actions Deployment Guide',
        'category' => 'deployment'
    ],
    [
        'url' => 'https://developer.mittwald.de/docs/v2/platform/deployment/deployer/',
        'title' => 'Deployer Deployment Guide',
        'category' => 'deployment'
    ],
    [
        'url' => 'https://developer.mittwald.de/docs/v2/platform/deployment/terraform/',
        'title' => 'Terraform Deployment Guide',
        'category' => 'deployment'
    ],
    [
        'url' => 'https://developer.mittwald.de/docs/v2/platform/deployment/typo3surf/',
        'title' => 'TYPO3 Surf Deployment Guide',
        'category' => 'deployment'
    ]
];

// Index each page
foreach ($pages as $page) {
    echo "Fetching {$page['url']}...\n";
    
    // Fetch page content
    $html = file_get_contents($page['url']);
    
    // Simple HTML stripping
    $content = strip_tags($html);
    $content = preg_replace('/\s+/', ' ', $content);
    $content = trim($content);
    
    // Create document
    $doc = [
        'title' => $page['title'],
        'url' => $page['url'],
        'content' => $content,
        'category' => $page['category'],
        'timestamp' => date('c')
    ];
    
    // Generate doc ID
    $docId = preg_replace('/[^a-zA-Z0-9]/', '-', $page['url']);
    
    // Index document
    $ch = curl_init("$opensearchUrl/$indexName/_doc/$docId");
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($doc));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $result = curl_exec($ch);
    curl_close($ch);
    
    echo "Indexed {$page['title']}: $result\n\n";
}

// Refresh index
$ch = curl_init("$opensearchUrl/$indexName/_refresh");
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_exec($ch);
curl_close($ch);

echo "All documents indexed successfully!\n\n";

// Test search
echo "Testing search for 'container'...\n";
$ch = curl_init("$opensearchUrl/$indexName/_search?q=container&pretty");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$searchResult = curl_exec($ch);
curl_close($ch);

echo "Search results:\n$searchResult\n";

// Display summary
echo "\n\nIndexing complete! You can now access OpenSearch Dashboards to search the indexed content.\n";
?>