import re
from typing import Dict, List, Any

class ApiMapper:
    """Map API definitions to command contexts"""
    
    def parse_api_definition(self, api_def: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse API definition and generate command contexts"""
        contexts = []
        
        # Group contexts by their primary domain
        context_groups = self.group_contexts_by_domain(api_def['contexts'])
        
        for domain, api_contexts in context_groups.items():
            context = {
                'id': domain,
                'name': self.format_context_name(domain),
                'description': self.generate_context_description(api_contexts),
                'color': self.get_context_color(domain),
                'icon': self.get_context_icon(domain),
                'patterns': []
            }
            
            # Generate patterns for each API context
            for api_context in api_contexts:
                patterns = self.generate_patterns_from_context(api_context, api_def['api_base_url'])
                context['patterns'].extend(patterns)
            
            contexts.append(context)
        
        return contexts
    
    def group_contexts_by_domain(self, contexts: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group API contexts by their primary domain/service"""
        groups = {}
        
        for context in contexts:
            domain = self.extract_domain(context)
            if domain not in groups:
                groups[domain] = []
            groups[domain].append(context)
        
        return groups
    
    def extract_domain(self, context: Dict[str, Any]) -> str:
        """Extract primary domain from context"""
        primary_tags = ['kafka', 'storage', 'service', 'database', 'kubernetes']
        
        for tag in context.get('context_tags', []):
            if tag.lower() in primary_tags:
                return tag.lower()
        
        # Fallback to extracting from ID
        context_id = context['id'].lower()
        if 'kafka' in context_id:
            return 'kafka'
        elif 'storage' in context_id or 'disk' in context_id:
            return 'storage'
        elif 'service' in context_id:
            return 'service'
        
        return 'general'
    
    def generate_patterns_from_context(self, api_context: Dict[str, Any], base_url: str) -> List[Dict[str, Any]]:
        """Generate regex patterns from API context triggers"""
        patterns = []
        
        # Create a comprehensive pattern that matches all triggers
        trigger_pattern = self.build_trigger_pattern(api_context['triggers'], api_context['parameters'])
        
        pattern = {
            'pattern': trigger_pattern,
            'intent': api_context['id'],
            'context': self.extract_domain(api_context),
            'action': self.extract_action(api_context['triggers'][0]),
            'parameters': [p['name'] for p in api_context['parameters']],
            'examples': self.generate_examples(api_context),
            'api': api_context['api']
        }
        
        patterns.append(pattern)
        return patterns
    
    def build_trigger_pattern(self, triggers: List[str], parameters: List[Dict[str, Any]]) -> str:
        """Build regex pattern from triggers and parameters"""
        # Create alternation of all triggers
        trigger_alts = [re.escape(trigger.replace(' ', r'\s+')) for trigger in triggers]
        pattern = f"(?:{'|'.join(trigger_alts)})"
        
        # Add parameter capture groups
        param_groups = []
        
        for param in parameters:
            param_name = param['name']
            if param_name == 'hostname':
                param_groups.append(r'(?:\s+(?:on|host)\s+([^\s]+))?')
            elif param_name == 'service_name':
                param_groups.append(r'(?:\s+(?:service\s+)?([^\s]+))?')
            elif param_name == 'cluster':
                param_groups.append(r'(?:\s+(?:in\s+)?cluster\s+([^\s]+))?')
            elif param_name == 'rack_id':
                param_groups.append(r'(?:\s+rack\s+([^\s]+))?')
            elif param_name == 'disk_paths':
                param_groups.append(r'(?:\s+paths?\s+([^,\s]+(?:,\s*[^,\s]+)*))?')
            elif param_name == 'cleanup_type':
                param_groups.append(r'(?:\s+(temp_files|log_files|cache|all))?')
            elif param_name == 'dry_run':
                param_groups.append(r'(?:\s+(dry[_\s]?run))?')
            elif param_name == 'force':
                param_groups.append(r'(?:\s+(force))?')
            else:
                param_groups.append(r'(?:\s+([^\s]+))?')
        
        pattern += ''.join(param_groups)
        return pattern
    
    def extract_action(self, trigger: str) -> str:
        """Extract action from trigger"""
        action_map = {
            'restart': 'restart',
            'bounce': 'restart',
            'reboot': 'restart',
            'start': 'start',
            'stop': 'stop',
            'clean': 'clean',
            'wipe': 'clean',
            'clear': 'clean',
            'create': 'create',
            'delete': 'delete',
            'scale': 'scale'
        }
        
        trigger_lower = trigger.lower()
        for key, action in action_map.items():
            if key in trigger_lower:
                return action
        
        return 'execute'
    
    def generate_examples(self, api_context: Dict[str, Any]) -> List[str]:
        """Generate example commands"""
        examples = []
        base_trigger = api_context['triggers'][0]
        
        # Generate examples with different parameter combinations
        param_names = [p['name'] for p in api_context['parameters']]
        
        if 'hostname' in param_names:
            examples.extend([
                f"{base_trigger} on server-01",
                f"{base_trigger} on host-prod-02"
            ])
        
        if 'service_name' in param_names:
            examples.extend([
                f"{base_trigger} nginx on web-01",
                f"{base_trigger} api-gateway on server-02"
            ])
        
        if 'cluster' in param_names:
            examples.append(f"{base_trigger} on server-01 in production")
        
        # Add specific examples based on context
        if 'clean_disks' in api_context['id']:
            examples.extend([
                f"{base_trigger} on storage-01 temp_files",
                f"{base_trigger} on server-02 paths /tmp,/var/log dry run"
            ])
        
        return examples[:4]
    
    def format_context_name(self, domain: str) -> str:
        """Format context name for display"""
        name_map = {
            'kafka': 'Apache Kafka',
            'storage': 'Storage Management',
            'service': 'Service Management',
            'database': 'Database Operations',
            'kubernetes': 'Kubernetes',
            'general': 'General Operations'
        }
        
        return name_map.get(domain, domain.capitalize())
    
    def generate_context_description(self, contexts: List[Dict[str, Any]]) -> str:
        """Generate context description"""
        operations = [c['name'].lower() for c in contexts]
        return f"Infrastructure operations including {', '.join(operations)}"
    
    def get_context_color(self, domain: str) -> str:
        """Get context color scheme"""
        color_map = {
            'kafka': 'from-orange-500 to-red-500',
            'storage': 'from-blue-500 to-cyan-500',
            'service': 'from-green-500 to-emerald-500',
            'database': 'from-purple-500 to-indigo-500',
            'kubernetes': 'from-indigo-500 to-purple-500',
            'general': 'from-gray-500 to-gray-600'
        }
        
        return color_map.get(domain, 'from-gray-500 to-gray-600')
    
    def get_context_icon(self, domain: str) -> str:
        """Get context icon"""
        icon_map = {
            'kafka': 'Zap',
            'storage': 'Database',
            'service': 'Container',
            'database': 'Database',
            'kubernetes': 'Boxes',
            'general': 'Settings'
        }
        
        return icon_map.get(domain, 'Settings')