import json
import re
from pathlib import Path

root = Path('src/app/api')
paths = {}

method_regex = re.compile(r'export async function (GET|POST|PUT|PATCH|DELETE)\(')
search_params_regex = re.compile(r'searchParams\.get\((["\'])(.+?)\1\)')
request_json_regex = re.compile(r'request\.json\(')
param_segments = re.compile(r'^\[(.+?)\]$')

for route_file in sorted(root.rglob('route.ts')):
    rel = route_file.relative_to(root)
    parts = rel.parts[:-1]
    if not parts:
        path = '/'
    else:
        path = '/' + '/'.join(
            '{' + param_segments.match(seg).group(1) + '}' if param_segments.match(seg) else seg
            for seg in parts
        )
    content = route_file.read_text(encoding='utf-8')
    methods = []
    for match in method_regex.finditer(content):
        methods.append(match.group(1).lower())
    if not methods:
        continue

    url_search_params = set(search_params_regex.findall(content))
    param_names = {name for _, name in url_search_params}
    has_request_body = bool(request_json_regex.search(content))
    
    if path not in paths:
        paths[path] = {}
    for method in methods:
        operation = {
            'summary': f'{method.upper()} {path}',
            'responses': {
                '200': {
                    'description': 'Successful response',
                    'content': {
                        'application/json': {
                            'schema': {
                                'type': 'object',
                                'properties': {
                                    'success': {'type': 'boolean'},
                                },
                                'additionalProperties': True,
                            }
                        }
                    }
                },
                '401': {'description': 'Unauthorized'},
                '500': {'description': 'Internal server error'},
            }
        }
        if method in ('post', 'put', 'patch') and has_request_body:
            operation['requestBody'] = {
                'required': True,
                'content': {
                    'application/json': {
                        'schema': {
                            'type': 'object',
                            'additionalProperties': True,
                        }
                    }
                }
            }
            operation['responses']['400'] = {'description': 'Bad request'}
        if '{' in path:
            operation['parameters'] = [
                {
                    'name': seg[1:-1],
                    'in': 'path',
                    'required': True,
                    'schema': {'type': 'string'},
                } for seg in path.split('/') if seg.startswith('{') and seg.endswith('}')
            ]
        if param_names:
            query_params = []
            for name in sorted(param_names):
                query_params.append({'name': name, 'in': 'query', 'required': False, 'schema': {'type': 'string'}})
            operation.setdefault('parameters', []).extend(query_params)
        paths[path][method] = operation

openapi = {
    'openapi': '3.1.0',
    'info': {
        'title': 'Nyx LogBook System API',
        'version': '1.0.0',
        'description': 'Generated OpenAPI 3.1 specification from implemented Next.js App Router API routes.',
    },
    'servers': [{'url': '/'}],
    'paths': paths,
}

output_path = Path('openapi.generated.json')
output_path.write_text(json.dumps(openapi, indent=2), encoding='utf-8')
print(f'Generated {output_path}')
