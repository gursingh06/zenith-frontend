command_contexts = [
    {
        'id': 'kafka',
        'name': 'Apache Kafka',
        'description': 'Kafka node and service management operations',
        'color': 'from-orange-500 to-red-500',
        'icon': 'Zap',
        'patterns': [
            {
                'pattern': r'(?:restart|bounce|reboot)\s+kafka(?:\s+node)?(?:\s+on\s+([^\s]+))?(?:\s+in\s+cluster\s+([^\s]+))?',
                'intent': 'restart_kafka_node',
                'context': 'kafka',
                'action': 'restart',
                'parameters': ['hostname', 'cluster'],
                'examples': [
                    'restart kafka node on server-01',
                    'bounce kafka on kafka-prod-01 in production',
                    'reboot kafka node on host-123'
                ],
                'api': {
                    'url': 'https://internal-api.company.com/kafka/restart',
                    'method': 'POST'
                }
            },
            {
                'pattern': r'(?:restart|bounce|reboot)\s+(?:kafka\s+)?(?:service|datanode)(?:\s+([^\s]+))?(?:\s+on\s+([^\s]+))?(?:\s+in\s+cluster\s+([^\s]+))?(?:\s+(force))?',
                'intent': 'restart_service',
                'context': 'kafka',
                'action': 'restart',
                'parameters': ['service_name', 'hostname', 'cluster', 'force'],
                'examples': [
                    'restart kafka datanode on server-01',
                    'restart service kafka-consumer on host-02 in staging',
                    'bounce service kafka-producer on server-03 force',
                    'restart datanode on kafka-node-01'
                ],
                'api': {
                    'url': 'https://internal-api.company.com/service/restart',
                    'method': 'POST'
                }
            }
        ]
    },
    {
        'id': 'storage',
        'name': 'Storage Management',
        'description': 'Storage node operations and disk maintenance',
        'color': 'from-blue-500 to-cyan-500',
        'icon': 'Database',
        'patterns': [
            {
                'pattern': r'(?:restart|reboot|bounce)\s+storage(?:\s+node)?(?:\s+on\s+([^\s]+))?(?:\s+rack\s+([^\s]+))?',
                'intent': 'restart_storage_node',
                'context': 'storage',
                'action': 'restart',
                'parameters': ['hostname', 'rack_id'],
                'examples': [
                    'restart storage node on storage-01',
                    'reboot storage on host-storage-02 rack A1',
                    'bounce box on storage-server-03'
                ],
                'api': {
                    'url': 'https://internal-api.company.com/storage/restart',
                    'method': 'POST'
                }
            },
            {
                'pattern': r'(?:clean|wipe|clear|cleanup|free\s+up)\s+(?:disks?|disk\s+space|storage)(?:\s+on\s+([^\s]+))?(?:\s+paths?\s+([^,\s]+(?:,\s*[^,\s]+)*))?(?:\s+(temp_files|log_files|cache|all))?(?:\s+(dry[_\s]?run))?',
                'intent': 'clean_disks',
                'context': 'storage',
                'action': 'clean',
                'parameters': ['hostname', 'disk_paths', 'cleanup_type', 'dry_run'],
                'examples': [
                    'clean disks on storage-01',
                    'wipe disks on server-02 paths /tmp,/var/log',
                    'clear disk space on host-03 temp_files',
                    'cleanup storage on storage-server-01 all dry run',
                    'free up disk space on server-04',
                    'disk maintenance on storage-02 cache'
                ],
                'api': {
                    'url': 'https://internal-api.company.com/storage/clean-disks',
                    'method': 'POST'
                }
            }
        ]
    },
    {
        'id': 'service',
        'name': 'Service Management',
        'description': 'General service operations and management',
        'color': 'from-green-500 to-emerald-500',
        'icon': 'Container',
        'patterns': [
            {
                'pattern': r'(?:restart|bounce|reboot)\s+service\s+([^\s]+)(?:\s+on\s+([^\s]+))?(?:\s+in\s+cluster\s+([^\s]+))?(?:\s+(force))?',
                'intent': 'restart_service',
                'context': 'service',
                'action': 'restart',
                'parameters': ['service_name', 'hostname', 'cluster', 'force'],
                'examples': [
                    'restart service nginx on web-01',
                    'bounce service api-gateway on server-02 in production',
                    'reboot service database on db-01 force',
                    'service restart mysql on db-server-01'
                ],
                'api': {
                    'url': 'https://internal-api.company.com/service/restart',
                    'method': 'POST'
                }
            }
        ]
    }
]