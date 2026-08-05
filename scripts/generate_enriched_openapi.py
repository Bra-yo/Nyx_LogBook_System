import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

ROOT = Path('src/app/api')
OUTPUT_JSON = Path('docs/api/openapi.json')
OUTPUT_YAML = Path('docs/api/openapi.yaml')

METHOD_RE = re.compile(r'export async function (GET|POST|PUT|PATCH|DELETE)\(')
SCHEMA_DEF_RE = re.compile(r'const\s+(\w+Schema)\s*=\s*z\.')
SCHEMA_PARSE_RE = re.compile(r'([A-Za-z0-9_]+Schema)\.(?:parse|safeParse)\(\s*([A-Za-z0-9_\.\(\)]+)\s*\)')
GET_SESSION_RE = re.compile(r'getServerSession\(\s*authOptions\s*\)')
ROLE_LIST_RE = re.compile(r'\[\s*([^\]]+)\s*\]\.includes\(session\.user\.role\)')
ROLE_EQ_RE = re.compile(r'session\.user\.role\s*===\s*["\']([^"\']+)["\']')
ROLE_NE_RE = re.compile(r'session\.user\.role\s*!==\s*["\']([^"\']+)["\']')
NEXTRESPONSE_RE = re.compile(r'NextResponse\.json\s*\(')
PATH_PARAM_RE = re.compile(r'\{([^}]+)\}')
ZOD_ERRORS_RE = re.compile(r'instanceof\s+z\.ZodError')
STATUS_ARG_RE = re.compile(r'status\s*:\s*(\d+)')


def balanced(text: str, start: int, open_char: str, close_char: str) -> (str, int):
    depth = 0
    pos = start
    while pos < len(text):
        ch = text[pos]
        if ch == open_char:
            depth += 1
        elif ch == close_char:
            depth -= 1
            if depth == 0:
                return text[start:pos + 1], pos + 1
        pos += 1
    raise ValueError('Unbalanced delimiters')


def extract_parenthesized(text: str, start: int) -> (str, int):
    return balanced(text, start, '(', ')')


def extract_braced(text: str, start: int) -> (str, int):
    return balanced(text, start, '{', '}')


def strip_modifiers(expr: str) -> (str, bool, bool):
    optional = False
    nullable = False
    expr = expr.strip()
    while True:
        if expr.endswith('.optional()'):
            optional = True
            expr = expr[:-len('.optional()')]
        elif expr.endswith('.nullable()'):
            nullable = True
            expr = expr[:-len('.nullable()')]
        else:
            break
    expr = re.sub(r'\.default\([^)]*\)', '', expr)
    expr = re.sub(r'\.describe\([^)]*\)', '', expr)
    expr = re.sub(r'\.trim\(\)', '', expr)
    expr = re.sub(r'\.transform\([^)]*\)', '', expr)
    expr = re.sub(r'\.pipe\([^)]*\)', '', expr)
    return expr.strip(), optional, nullable


def parse_zod_schema(expr: str, schemas: Dict[str, Any]) -> Dict[str, Any]:
    expr, optional, nullable = strip_modifiers(expr)
    schema: Dict[str, Any] = {}
    if expr.startswith('z.string'):
        schema['type'] = 'string'
        if '.email()' in expr:
            schema['format'] = 'email'
        if '.url(' in expr:
            schema['format'] = 'uri'
        if '.uuid(' in expr:
            schema['format'] = 'uuid'
        m = re.search(r'\.min\((\d+)\)', expr)
        if m:
            schema['minLength'] = int(m.group(1))
        m = re.search(r'\.max\((\d+)\)', expr)
        if m:
            schema['maxLength'] = int(m.group(1))
    elif expr.startswith('z.number'):
        schema['type'] = 'number'
        if '.int()' in expr:
            schema['type'] = 'integer'
        m = re.search(r'\.min\((-?\d+)\)', expr)
        if m:
            schema['minimum'] = int(m.group(1))
        m = re.search(r'\.max\((-?\d+)\)', expr)
        if m:
            schema['maximum'] = int(m.group(1))
    elif expr.startswith('z.boolean'):
        schema['type'] = 'boolean'
    elif expr.startswith('z.enum'):
        arr = re.search(r'z\.enum\((\[[^\]]+\])\)', expr)
        if arr:
            values = [item.strip().strip("'\"") for item in arr.group(1).strip('[]').split(',')]
            schema['type'] = 'string'
            schema['enum'] = values
        else:
            schema['type'] = 'string'
    elif expr.startswith('z.literal'):
        lit = re.search(r'z\.literal\((.+)\)', expr)
        if lit:
            value = lit.group(1).strip().strip('"\'')
            schema['const'] = value
            schema['type'] = 'string'
    elif expr.startswith('z.array'):
        inner = re.search(r'z\.array\((.+)\)$', expr)
        if inner:
            schema['type'] = 'array'
            schema['items'] = parse_zod_schema(inner.group(1), schemas)
        else:
            schema['type'] = 'array'
            schema['items'] = {'type': 'object'}
    elif expr.startswith('z.record'):
        schema['type'] = 'object'
        schema['additionalProperties'] = True
    elif expr.startswith('z.object'):
        pos = expr.find('z.object(') + len('z.object(')
        if pos < len(expr) and expr[pos] == '{':
            obj_text, _ = extract_braced(expr, pos)
            schema = parse_zod_object(obj_text, schemas)
        else:
            schema['type'] = 'object'
            schema['additionalProperties'] = True
    elif expr in schemas:
        return schemas[expr]
    else:
        schema['type'] = 'object'
        schema['additionalProperties'] = True
    if nullable:
        if 'type' in schema and not isinstance(schema['type'], list):
            schema['type'] = [schema['type'], 'null']
        else:
            schema['type'] = schema.get('type', 'null')
    if optional and 'nullable' not in schema:
        schema['nullable'] = True
    return schema


def parse_zod_object(text: str, schemas: Dict[str, Any]) -> Dict[str, Any]:
    assert text.startswith('{') and text.endswith('}')
    inner = text[1:-1].strip()
    fields = split_top_level(inner, ',')
    props: Dict[str, Any] = {}
    required: List[str] = []
    for field in fields:
        if ':' not in field:
            continue
        name, expr = field.split(':', 1)
        name = name.strip()
        expr = expr.strip()
        if not name:
            continue
        props[name] = parse_zod_schema(expr, schemas)
        if '.optional()' not in expr and '.default(' not in expr and '.nullable()' not in expr:
            required.append(name)
    schema = {'type': 'object', 'properties': props}
    if required:
        schema['required'] = required
    return schema


def split_top_level(text: str, sep: str) -> List[str]:
    parts: List[str] = []
    depth = 0
    last = 0
    i = 0
    while i < len(text):
        ch = text[i]
        if ch in '{[(':
            closing = {'{': '}', '[': ']', '(': ')'}[ch]
            _, i = balanced(text, i, ch, closing)
            continue
        if ch == sep and depth == 0:
            parts.append(text[last:i].strip())
            last = i + 1
        i += 1
    parts.append(text[last:].strip())
    return parts


def parse_schema_definitions(file_text: str) -> Dict[str, Any]:
    schemas: Dict[str, Any] = {}
    for match in SCHEMA_DEF_RE.finditer(file_text):
        name = match.group(1)
        start = match.end() - 1
        try:
            expr, _ = extract_parenthesized(file_text, start)
        except ValueError:
            continue
        full = file_text[match.start(): start + len(expr)]
        # locate the expr starting at first z.
        start_z = full.find('z.')
        if start_z == -1:
            continue
        schema = parse_zod_schema(full[start_z:], schemas)
        schemas[name] = schema
    return schemas


def parse_roles(file_text: str) -> List[str]:
    roles = set()
    for m in ROLE_LIST_RE.finditer(file_text):
        values = [item.strip().strip('"\'') for item in m.group(1).split(',')]
        roles.update(values)
    for m in ROLE_EQ_RE.finditer(file_text):
        roles.add(m.group(1))
    return sorted(roles)


def parse_response_calls(file_text: str) -> Dict[int, Dict[str, Any]]:
    responses: Dict[int, Dict[str, Any]] = {}
    idx = 0
    while True:
        m = NEXTRESPONSE_RE.search(file_text, idx)
        if not m:
            break
        start = m.end() - 1
        try:
            arg_text, end = extract_parenthesized(file_text, start)
        except ValueError:
            break
        arg = arg_text[1:-1].strip()
        args = split_top_level(arg, ',')
        status = 200
        schema = {'type': 'object', 'additionalProperties': True, 'description': 'TODO: infer response schema'}
        if args:
            first_arg = args[0].strip()
            if first_arg.startswith('{') or first_arg.startswith('['):
                schema = infer_schema_from_literal(first_arg)
        if len(args) > 1:
            status_match = STATUS_ARG_RE.search(args[1])
            if status_match:
                status = int(status_match.group(1))
        # If the first argument is a literal and there is no second arg,
        # the default status is 200, otherwise preserve generic inference.
        responses.setdefault(status, schema)
        idx = start + end
    return responses


def infer_schema_from_literal(text: str) -> Dict[str, Any]:
    try:
        sanitized = re.sub(r'([,{\s])(\w+)\s*:', r'\1"\2":', text)
        sanitized = sanitized.replace("'", '"')
        sanitized = re.sub(r'\bundefined\b', 'null', sanitized)
        parsed = json.loads(sanitized)
        return infer_schema_from_value(parsed)
    except Exception:
        return {'type': 'object', 'additionalProperties': True, 'description': 'TODO: infer response schema'}


def infer_schema_from_value(value: Any) -> Dict[str, Any]:
    if isinstance(value, bool):
        return {'type': 'boolean', 'example': value}
    if isinstance(value, int) and not isinstance(value, bool):
        return {'type': 'integer', 'example': value}
    if isinstance(value, float):
        return {'type': 'number', 'example': value}
    if isinstance(value, str):
        return {'type': 'string', 'example': value}
    if isinstance(value, list):
        if value:
            return {'type': 'array', 'items': infer_schema_from_value(value[0]), 'example': value}
        return {'type': 'array', 'items': {'type': 'string'}, 'example': []}
    if isinstance(value, dict):
        props = {k: infer_schema_from_value(v) for k, v in value.items()}
        schema = {'type': 'object', 'properties': props, 'example': value}
        if props:
            schema['required'] = list(props.keys())
        return schema
    return {'type': 'string', 'example': str(value)}


def build_path(route_file: Path) -> str:
    rel = route_file.relative_to(ROOT)
    parts = rel.parts[:-1]
    if not parts:
        return '/'
    return '/' + '/'.join('{' + seg[1:-1] + '}' if seg.startswith('[') and seg.endswith(']') else seg for seg in parts)


def extract_schema_name(file_text: str, target_name: str) -> Optional[str]:
    # find parse of body or query using schema names
    for m in SCHEMA_PARSE_RE.finditer(file_text):
        schema_name = m.group(1)
        arg = m.group(2)
        if target_name == 'body' and arg == 'body':
            return schema_name
        if target_name == 'query' and 'Object.fromEntries(searchParams)' in arg:
            return schema_name
    return None


def infer_operation_data(route_file: Path, file_text: str, schemas: Dict[str, Any]) -> Dict[str, Any]:
    methods = [m.group(1).lower() for m in METHOD_RE.finditer(file_text)]
    path = build_path(route_file)
    roles = parse_roles(file_text)
    auth_required = bool(GET_SESSION_RE.search(file_text))
    body_schema_name = extract_schema_name(file_text, 'body')
    query_schema_name = extract_schema_name(file_text, 'query')
    responses = parse_response_calls(file_text)
    error_statuses = set(responses.keys())
    if auth_required:
        error_statuses.add(401)
    if ZOD_ERRORS_RE.search(file_text):
        error_statuses.add(400)
    # Add generic 500 if not already present
    responses.setdefault(500, {'type': 'object', 'additionalProperties': True, 'description': 'Internal server error'})
    operations: Dict[str, Any] = {}
    for method in methods:
        op: Dict[str, Any] = {
            'summary': f'{method.upper()} {path}',
            'description': f'Endpoint implemented in {route_file}.',
            'tags': [path.split('/')[1].capitalize()] if path != '/' else ['Root'],
            'responses': {},
        }
        if auth_required:
            op['security'] = [{'nextAuthSession': []}]
            if roles:
                op['x-roles'] = roles
        params: List[Dict[str, Any]] = []
        for name in PATH_PARAM_RE.findall(path):
            params.append({'name': name, 'in': 'path', 'required': True, 'schema': {'type': 'string'}, 'description': f'Path parameter {name}.'})
        if query_schema_name and query_schema_name in schemas:
            query_schema = schemas[query_schema_name]
            if query_schema.get('type') == 'object':
                for pname, pschema in query_schema.get('properties', {}).items():
                    params.append({'name': pname, 'in': 'query', 'required': pname in query_schema.get('required', []), 'schema': pschema, 'description': f'Query parameter {pname}.'})
        if params:
            op['parameters'] = params
        if method in ('post', 'put', 'patch') and body_schema_name and body_schema_name in schemas:
            op['requestBody'] = {'required': True, 'content': {'application/json': {'schema': schemas[body_schema_name]}}}
        for status, schema in sorted(responses.items()):
            op['responses'][str(status)] = {
                'description': 'Success' if status == 200 else 'Error response',
                'content': {'application/json': {'schema': schema}}
            }
        operations[method] = op
    return operations


def main() -> None:
    all_paths: Dict[str, Dict[str, Any]] = {}
    for route_file in sorted(ROOT.rglob('route.ts')):
        text = route_file.read_text(encoding='utf-8')
        schemas = parse_schema_definitions(text)
        ops = infer_operation_data(route_file, text, schemas)
        path = build_path(route_file)
        if not ops:
            continue
        all_paths.setdefault(path, {}).update(ops)
    spec = {
        'openapi': '3.1.0',
        'info': {
            'title': 'Nyx LogBook System API',
            'version': '1.0.0',
            'description': 'Enriched OpenAPI 3.1 specification generated from actual route implementations.',
        },
        'servers': [{'url': '/'}],
        'paths': all_paths,
        'components': {
            'securitySchemes': {
                'nextAuthSession': {
                    'type': 'apiKey',
                    'in': 'cookie',
                    'name': 'next-auth.session-token',
                    'description': 'NextAuth session cookie used for authenticated requests.',
                }
            }
        }
    }
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_JSON.write_text(json.dumps(spec, indent=2), encoding='utf-8')
    import yaml
    OUTPUT_YAML.write_text(yaml.safe_dump(spec, sort_keys=False), encoding='utf-8')
    print(f'Wrote {OUTPUT_JSON} and {OUTPUT_YAML}')
