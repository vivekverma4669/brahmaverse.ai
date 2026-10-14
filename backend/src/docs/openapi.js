const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema) => ({ 'application/json': { schema } });
const response = (description, schema) => ({ description, content: json(schema) });
const object = (properties, required = []) => ({ type: 'object', properties, required });
const text = (extra = {}) => ({ type: 'string', ...extra });
const id = text({ pattern: '^[a-fA-F0-9]{24}$', example: '507f1f77bcf86cd799439011' });
const email = text({ format: 'email', maxLength: 254, example: 'alice@example.com' });
const name = text({ minLength: 2, maxLength: 100, example: 'Alice Counselor' });
const timestamps = { createdAt: text({ format: 'date-time' }), updatedAt: text({ format: 'date-time' }) };
const success = (properties) => object({ success: { type: 'boolean', example: true }, message: text(), data: object(properties) }, ['success', 'data']);
const errors = (...codes) => Object.fromEntries(codes.map((code) => [code, response({
  400: 'Invalid input or unsupported fields.', 401: 'Invalid credentials or missing/invalid/expired JWT.',
  404: 'Enquiry not found.', 409: 'Duplicate email or enquiry already claimed.', 500: 'Unexpected server error.',
}[code], ref('Error'))]));
const body = (schema) => ({ required: true, content: json(ref(schema)) });
const protectedRoute = { security: [{ bearerAuth: [] }] };
const pagination = [
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 1000000, default: 1 } },
  { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
];
const listing = (operationId, summary, description) => ({
  ...protectedRoute, operationId, tags: ['Enquiries'], summary, description, parameters: pagination,
  responses: { 200: response('Newest-first paginated enquiries.', ref('EnquiryList')), ...errors(400, 401, 500) },
});

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'CRM Developer Assignment API', version: '1.0.0',
    description: 'Review flow: register an employee, log in, copy data.token into Authorize (token only), submit a public enquiry, list unclaimed enquiries, claim its _id, then list your private enquiries. To verify privacy, repeat with a second employee. Public enquiry submission needs no token. React is a separate local demo at http://127.0.0.1:5173 (OTP: 123456).',
  },
  servers: [{ url: '/', description: 'Current API server' }],
  tags: [{ name: 'Employees' }, { name: 'Enquiries' }, { name: 'Health' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Register: { ...object({ name, email, password: text({ minLength: 8, description: 'Maximum 72 UTF-8 bytes. Password is not trimmed.', example: 'StrongPassword123!' }) }, ['name', 'email', 'password']), additionalProperties: false },
      Login: { ...object({ email, password: text({ minLength: 1, description: 'Maximum 72 UTF-8 bytes.', example: 'StrongPassword123!' }) }, ['email', 'password']), additionalProperties: false },
      Employee: object({ _id: id, name, email, ...timestamps }),
      EnquiryInput: { ...object({
        name: { ...name, example: 'Prospective Client' }, email: { ...email, example: 'client@example.com' },
        courseInterest: text({ minLength: 2, maxLength: 120, example: 'Full Stack Development' }),
        phone: text({ maxLength: 25, description: 'Optional; empty or 7-15 digits with common phone punctuation.', example: '+91 9876543210' }),
        message: text({ maxLength: 2000, example: 'Please share course details.' }),
      }, ['name', 'email', 'courseInterest']), additionalProperties: false },
      Enquiry: object({ _id: id, name, email, courseInterest: text(), phone: text(), message: text(), claimedBy: { ...id, nullable: true }, ...timestamps }),
      EmployeeResponse: success({ employee: ref('Employee') }),
      LoginResponse: success({ token: text(), employee: ref('Employee') }),
      EnquiryResponse: success({ enquiry: ref('Enquiry') }),
      EnquiryList: { ...success({ enquiries: { type: 'array', items: ref('Enquiry') } }), properties: {
        ...success({ enquiries: { type: 'array', items: ref('Enquiry') } }).properties,
        pagination: object(Object.fromEntries(['page', 'limit', 'total', 'pages'].map((key) => [key, { type: 'integer' }]))),
      } },
      Error: object({ success: { type: 'boolean', example: false }, message: text(), requestId: text(), errors: { type: 'array', items: object({ field: text(), message: text() }) } }, ['success', 'message', 'requestId']),
      Health: object({ success: { type: 'boolean' }, data: object({ status: text({ enum: ['ok', 'unavailable'] }), database: text({ enum: ['connected', 'disconnected'] }) }) }),
    },
  },
  paths: {
    '/api/auth/register': { post: {
      operationId: 'registerEmployee', tags: ['Employees'], summary: 'Register an employee',
      description: 'Creates an employee; does not issue a token. Log in afterward. Email is unique and normalized to lowercase.',
      requestBody: body('Register'), responses: { 201: response('Employee registered.', ref('EmployeeResponse')), ...errors(400, 409, 500) },
    } },
    '/api/auth/login': { post: {
      operationId: 'loginEmployee', tags: ['Employees'], summary: 'Log in and obtain a JWT', requestBody: body('Login'),
      responses: { 200: response('Copy data.token into Authorize.', ref('LoginResponse')), ...errors(400, 401, 500) },
    } },
    '/api/auth/me': { get: {
      ...protectedRoute, operationId: 'currentEmployee', tags: ['Employees'], summary: 'Fetch the logged-in employee',
      responses: { 200: response('Employee profile without password.', ref('EmployeeResponse')), ...errors(401, 500) },
    } },
    '/api/enquiries': { post: {
      operationId: 'submitEnquiry', tags: ['Enquiries'], summary: 'Submit a public enquiry without authentication',
      description: 'Always creates an unclaimed enquiry. Client-supplied ownership and unsupported fields are rejected.',
      requestBody: body('EnquiryInput'), responses: { 201: response('Enquiry submitted.', ref('EnquiryResponse')), ...errors(400, 500) },
    } },
    '/api/enquiries/public': { get: listing('listPublicEnquiries', 'Fetch unclaimed leads', 'Visible to all authenticated employees. Only unclaimed enquiries are returned.') },
    '/api/enquiries/my': { get: listing('listMyEnquiries', 'Fetch your claimed leads', 'Only enquiries owned by the logged-in employee are returned.') },
    '/api/enquiries/{id}/claim': { patch: {
      ...protectedRoute, operationId: 'claimEnquiry', tags: ['Enquiries'], summary: 'Claim a lead exclusively',
      description: 'No request body needed. Atomic claim: only one employee can win. Already claimed leads return 409, including repeated claims by the owner; no private payload is disclosed.',
      parameters: [{ name: 'id', in: 'path', required: true, description: 'Copy _id from a public enquiry.', schema: id }],
      responses: { 200: response('Enquiry claimed.', ref('EnquiryResponse')), ...errors(400, 401, 404, 409, 500) },
    } },
    '/api/health': { get: {
      operationId: 'healthCheck', tags: ['Health'], summary: 'Check API and database health',
      responses: { 200: response('Database connected.', ref('Health')), 503: response('Database disconnected.', ref('Health')) },
    } },
  },
};
