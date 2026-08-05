import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    import yaml
except ImportError:
    yaml = None

ROOT = Path('src/app/api')
OPENAPI_JSON = Path('openapi.generated.json')
DOCS_JSON = Path('docs/api/openapi.json')
DOCS_YAML = Path('docs/api/openapi.yaml')

ZOD_SCHEMA_RE = re.compile(r'const\s+(\w+Schema)\s*=\s*z\.object\s*\(')
REQUEST_JSON_RE = re.compile(r'request\.json\(')
SAFE_PARSE_RE = re.compile(r'(\w+Schema)\.safeParse\(')
PARSE_RE = re.compile(r'(\w+Schema)\.parse\(')
GET_SESSION_RE = re.compile(r'getServerSession\(authOptions\)')
ROLE_CHECK_RE = re.compile(r'session\.?user\.?role\s*([!=]=+|===?)\s*([\w"\']+)')
STATUS_CODE_RE = re.compile(r'NextResponse\.json\([^\)]*\{[^\}]*\}\s*,\s*\{[^\}]*status\s*:\s*(\d{3})')
RESPONSE_OBJECT_RE = re.compile(r'NextResponse\.json\s*\(\s*\{(.*?)\}\s*(?:,\s*\{[^\}]*status\s*:\s*(\d{3})[^\}]*\})?\s*\)', re.S)
SEARCH_PARAMS_RE = re.compile(r'searchParams\.get\(\s*(["\'])(.+?)\1\s*\)')

# Simple parser that handles pipe-separated string/number/boolean and nested z.object / z.array

def parse_zod_type(expr: str) -> Tuple[Dict[str, Any], bool, bool]:
    """Parse a zod expression into an OpenAPI schema fragment.
    Returns (schema, optional, nullable)."""
    schema: Dict[str, Any] = {}
    optional = False
    nullable = False
    expr = expr.strip()
    # strip common wrappers
    while True:
        changed = False
        if expr.endswith('.optional()'):
            optional = True
            expr = expr[: -len('.optional()')]
            changed = True
        if expr.endswith('.nullable()'):
            nullable = True
            expr = expr[: -len('.nullable()')]
            changed = True
        if expr.endswith('.trim()'):
            expr = expr[: -len('.trim()')]
            changed = True
        if expr.endswith('.int()'):
            schema['type'] = 'integer'
            expr = expr[: -len('.int()')]
            changed = True
        if expr.endswith('.email()'):
            schema['format'] = 'email'
            expr = expr[: -len('.email()')]
            changed = True
        if expr.endswith('.url()'):
            schema['format'] = 'uri'
            expr = expr[: -len('.url()')]
            changed = True
        if expr.endswith('.uuid()'):
            schema['format'] = 'uuid'
            expr = expr[: -len('.uuid()')]
            changed = True
        if expr.endswith('.min('):
            break
        if expr.endswith('.max('):
            break
        if expr.endswith('.length('):
            break
        if not changed:
            break
    expr = expr.strip()

    if expr.startswith('z.string()'):
        schema['type'] = 'string'
    elif expr.startswith('z.number()'):
        schema['type'] = schema.get('type', 'number')
    elif expr.startswith('z.boolean()'):
        schema['type'] = 'boolean'
    elif expr.startswith('z.array('):
        inner = expr[len('z.array('):-1].strip()
        item_schema, _, _ = parse_zod_type(inner)
        schema['type'] = 'array'
        schema['items'] = item_schema
    elif expr.startswith('z.enum('):
        enums = re.search(r'z\.enum\(\s*\[(.*?)\]\s*\)', expr, re.S)
        if enums:
            values = [v.strip().strip('"\'') for v in enums.group(1).split(',') if v.strip()]
            schema['type'] = 'string'
            schema['enum'] = values
    elif expr.startswith('z.object('):
        inner = expr[len('z.object('):].strip()
        if inner.startswith('{') and inner.endswith(')'):
            inner = inner[1:-2] if inner.endswith('})') else inner[1:-1]
            obj_schema = parse_zod_object_body(inner)
            schema.update(obj_schema)
        else:
            schema['type'] = 'object'
            schema['additionalProperties'] = True
    elif expr.startswith('z.record('):
        schema['type'] = 'object'
        schema['additionalProperties'] = True
    elif expr.startswith('z.any()') or expr.startswith('z.unknown()'):
        schema = {'type': 'object', 'additionalProperties': True}
    else:
        schema['type'] = 'string'

    # Handle min/max constraints
    for m in re.finditer(r'\.min\((\d+)', expr):
        if schema.get('type') == 'string':
            schema['minLength'] = int(m.group(1))
        else:
            schema['minimum'] = int(m.group(1))
    for m in re.finditer(r'\.max\((\d+)', expr):
        if schema.get('type') == 'string':
            schema['maxLength'] = int(m.group(1))
        else:
            schema['maximum'] = int(m.group(1))
    for m in re.finditer(r'\.length\((\d+)', expr):
        schema['minLength'] = schema['maxLength'] = int(m.group(1))

    if nullable:
        schema['nullable'] = True
    return schema, optional, nullable


def parse_zod_object_body(body: str) -> Dict[str, Any]:
    properties: Dict[str, Any] = {}
    required: List[str] = []
    lines = [line.strip() for line in body.splitlines() if line.strip() and not line.strip().startswith('//')]
    current_key = None
    current_expr = ''
    brace_depth = 0

    for line in lines:
        if current_key is None:
            if ':' not in line:
                continue
            key, rest = line.split(':', 1)
            key = key.strip().strip('"\'')
            rest = rest.strip().rstrip(',')
            if rest.count('{') != rest.count('}') and rest.endswith('(') is False and rest.endswith(')') is False:
                current_key = key
                current_expr = rest
                brace_depth = rest.count('(') - rest.count(')')
                continue
            schema, optional, _ = parse_zod_type(rest)
            properties[key] = schema
            if not optional:
                required.append(key)
        else:
            current_expr += ' ' + line.rstrip(',')
            brace_depth += line.count('(') - line.count(')')
            if brace_depth <= 0:
                schema, optional, _ = parse_zod_type(current_expr)
                properties[current_key] = schema
                if not optional:
                    required.append(current_key)
                current_key = None
                current_expr = ''
    result: Dict[str, Any] = {'type': 'object', 'properties': properties}
    if required:
        result['required'] = sorted(set(required))
    return result


def extract_schema_from_file(path: Path) -> Optional[Dict[str, Any]]:
    content = path.read_text(encoding='utf-8')
    schema_names = {m.group(1) for m in ZOD_SCHEMA_RE.finditer(content)}
    if not schema_names:
        return None
    # get the definitions for each schema name
    for schema_name in schema_names:
        if schema_name not in content:
            continue
    # find first schema used with request body
    body_schema_name = None
    for m in SAFE_PARSE_RE.finditer(content):
        if m.group(1) in schema_names:
            body_schema_name = m.group(1)
            break
    if not body_schema_name:
        for m in PARSE_RE.finditer(content):
            if m.group(1) in schema_names:
                body_schema_name = m.group(1)
                break
    if not body_schema_name:
        return None

    pattern = re.compile(rf'const\s+{re.escape(body_schema_name)}\s*=\s*z\.object\s*\((.*?)\)\s*;', re.S)
    m = pattern.search(content)
    if not m:
        return None
    body = m.group(1).strip()
    if body.startswith('{') and body.endswith('}'):  # direct object
        parsed = parse_zod_object_body(body[1:-1])
        return parsed
    if body.startswith('{'):
        parsed = parse_zod_object_body(body[1:-1])
        return parsed
    return None


def parse_json_object_literal(text: str) -> Dict[str, Any]:
    obj: Dict[str, Any] = {}
    pattern = re.compile(r'(["\']?)([A-Za-z0-9_]+)\1\s*:\s*([^,\n]+)')
    for match in pattern.finditer(text):
        key = match.group(2)
        raw_value = match.group(3).strip()
        if raw_value.startswith('"') or raw_value.startswith("'"):
            obj[key] = {'type': 'string', 'example': raw_value.strip('"\'')}
        elif raw_value in ('true', 'false'):
            obj[key] = {'type': 'boolean', 'example': raw_value == 'true'}
        elif re.match(r'^\d+$', raw_value):
            obj[key] = {'type': 'integer', 'example': int(raw_value)}
        elif re.match(r'^\d+\.\d+$', raw_value):
            obj[key] = {'type': 'number', 'example': float(raw_value)}
        elif raw_value.startswith('{'):
            obj[key] = {'type': 'object', 'description': 'TODO: nested object schema'}
        elif raw_value.startswith('['):
            obj[key] = {'type': 'array', 'items': {'type': 'string'}, 'description': 'TODO: array schema'}
        else:
            obj[key] = {'type': 'object', 'description': 'TODO: infer actual structure from implementation'}
    return obj


def extract_responses_from_file(path: Path) -> Dict[str, Any]:
    content = path.read_text(encoding='utf-8')
    responses: Dict[str, Any] = {}
    for m in RESPONSE_OBJECT_RE.finditer(content):
        body_text = m.group(1)
        status_code = m.group(2) or '200'
        schema = {'type': 'object', 'properties': {}, 'required': []}
        props = parse_json_object_literal(body_text)
        for key, val in props.items():
            schema['properties'][key] = {k: v for k, v in val.items() if k != 'example'}
            if key in ('success', 'error', 'message', 'data', 'id', 'status'):
                schema['properties'][key].update({'description': 'TODO: actual response field'})
            if key in ('success',):
                schema['properties'][key]['type'] = 'boolean'
            if key not in ('success',) and not val.get('description'):
                schema['properties'][key].update({'description': 'TODO: infer actual structure from implementation'})
            if key == 'success':
                schema['required'].append(key)
        if not schema['properties']:
            schema = {'type': 'object', 'additionalProperties': True}
        responses[status_code] = {
            'description': 'Successful response' if status_code == '200' else 'Error response',
            'content': {
                'application/json': {
                    'schema': schema
                }
            }
        }
    # if no explicit response body found, default to success object
    if not responses:
        responses['200'] = {
            'description': 'Successful response',
            'content': {
                'application/json': {
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'success': {'type': 'boolean'}
                        },
                        'additionalProperties': True,
                    }
                }
            }
        }
    return responses


def collect_route_metadata(path: Path) -> Dict[str, Any]:
    content = path.read_text(encoding='utf-8')
    meta: Dict[str, Any] = {}
    meta['authRequired'] = bool(GET_SESSION_RE.search(content))
    if meta['authRequired']:
        roles = set()
        for m in ROLE_CHECK_RE.finditer(content):
            rhs = m.group(2).strip() if m.group(2) else ''
            rhs = rhs.strip('"\'')
            if rhs:
                roles.add(rhs)
        if roles:
            meta['roles'] = sorted(roles)
    schema = extract_schema_from_file(path)
    if schema is not None:
        meta['requestBodySchema'] = schema
    meta['queryParameters'] = sorted({name for _, name in SEARCH_PARAMS_RE.findall(content)})
    responses = extract_responses_from_file(path)
    meta['responses'] = responses
    return meta


def add_examples_to_schema(schema: Dict[str, Any]) -> None:
    if schema.get('type') == 'object':
        example: Dict[str, Any] = {}
        for prop, prop_schema in schema.get('properties', {}).items():
            if 'example' in prop_schema:
                example[prop] = prop_schema['example']
            elif prop_schema.get('enum'):
                example[prop] = prop_schema['enum'][0]
            elif prop_schema.get('type') == 'string':
                example[prop] = f'string_{prop}'
            elif prop_schema.get('type') == 'integer':
                example[prop] = 0
            elif prop_schema.get('type') == 'number':
                example[prop] = 0.0
            elif prop_schema.get('type') == 'boolean':
                example[prop] = True
            elif prop_schema.get('type') == 'array':
                example[prop] = []
            elif prop_schema.get('type') == 'object':
                example[prop] = {}
            else:
                example[prop] = None
        schema['example'] = example
    if schema.get('type') == 'array' and 'items' in schema:
        schema['example'] = []


def main() -> None:
    if not DOCS_JSON.parent.exists():
        DOCS_JSON.parent.mkdir(parents=True, exist_ok=True)

    if not OPENAPI_JSON.exists():
        raise FileNotFoundError('openapi.generated.json not found')

    openapi = json.loads(OPENAPI_JSON.read_text(encoding='utf-8'))

    # Build route file mapping from source tree
    route_file_map: Dict[Tuple[str, str], Path] = {}
    for route_file in sorted(ROOT.rglob('route.ts')):
        rel = route_file.relative_to(ROOT)
        parts = rel.parts[:-1]
        if not parts:
            path = '/'
        else:
            path = '/' + '/'.join(
                '{' + seg[1:-1] + '}' if seg.startswith('[') and seg.endswith(']') else seg
                for seg in parts
            )
        content = route_file.read_text(encoding='utf-8')
        methods = [m.group(1).lower() for m in method_regex.finditer(content)] if (method_regex := re.compile(r'export async function (GET|POST|PUT|PATCH|DELETE)\(')) else []
        for method in methods:
            route_file_map[(path, method)] = route_file

    for path, path_item in openapi['paths'].items():
        for method, operation in path_item.items():
            file_path = route_file_map.get((path, method))
            if not file_path:
                continue
            meta = collect_route_metadata(file_path)
            # Summary and description
            operation['summary'] = operation.get('summary', f'{method.upper()} {path}')
            if 'description' not in operation:
                operation['description'] = f'Endpoint implemented in {file_path.as_posix()}. TODO: refine description from route implementation.'
            # Tags
            root_tag = path.strip('/').split('/')[0] if path.strip('/') else 'Root'
            operation['tags'] = [root_tag.capitalize()]
            # Security
            if meta.get('authRequired'):
                operation['security'] = [{'nextAuthSession': []}]
            # x-roles extension for role requirements
            if meta.get('roles'):
                operation['x-roles'] = meta['roles']
            # Query parameters
            if meta.get('queryParameters'):
                params = operation.get('parameters', [])
                if not isinstance(params, list):
                    params = []
                for name in meta['queryParameters']:
                    if not any(p.get('name') == name and p.get('in') == 'query' for p in params):
                        params.append({
                            'name': name,
                            'in': 'query',
                            'required': False,
                            'schema': {'type': 'string'},
                            'description': 'TODO: extracted from route implementation',
                        })
                operation['parameters'] = params
            # Path parameter descriptions
            if 'parameters' in operation:
                params = operation['parameters']
                for param in params:
                    if param.get('in') == 'path' and 'description' not in param:
                        param['description'] = 'TODO: path parameter from route implementation'
            # Request body schema
            if meta.get('requestBodySchema') is not None:
                schema = meta['requestBodySchema']
                add_examples_to_schema(schema)
                operation['requestBody'] = {
                    'required': True,
                    'content': {
                        'application/json': {
                            'schema': schema,
                            'examples': {
                                'request': {'value': schema.get('example', {})}
                            }
                        }
                    }
                }
            elif 'requestBody' in operation:
                operation['requestBody']['content']['application/json']['schema'] = {
                    'type': 'object',
                    'additionalProperties': True,
                    'description': 'TODO: request body schema inferred from implementation',
                }

            # Responses
            responses = meta.get('responses', {})
            for status, response in responses.items():
                schema = response['content']['application/json']['schema']
                add_examples_to_schema(schema)
                response['content']['application/json']['schema'] = schema
                response['content']['application/json']['examples'] = {
                    'response': {'value': schema.get('example', {'success': True})}
                }
            operation['responses'] = responses

    openapi['components'] = openapi.get('components', {})
    openapi['components']['securitySchemes'] = {
        'nextAuthSession': {
            'type': 'apiKey',
            'in': 'cookie',
            'name': 'next-auth.session-token',
            'description': 'NextAuth session cookie used by authenticated API routes',
        }
    }
    openapi['components'].setdefault('schemas', {})

    # write enriched JSON and YAML
    DOCS_JSON.write_text(json.dumps(openapi, indent=2), encoding='utf-8')
    if yaml is None:
        raise RuntimeError('PyYAML is required to generate YAML output. Install pyyaml in the environment.')
    DOCS_YAML.write_text(yaml.safe_dump(openapi, sort_keys=False), encoding='utf-8')

    if OPENAPI_JSON.exists():
        OPENAPI_JSON.unlink()
    print(f'Enriched OpenAPI written to {DOCS_JSON} and {DOCS_YAML}')

if __name__ == '__main__':
    main()
