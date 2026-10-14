import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/crm_assignment_test';
process.env.JWT_SECRET = randomBytes(48).toString('hex');
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_SALT_ROUNDS = '10';
process.env.CORS_ORIGIN = 'http://127.0.0.1:5173';
const { createApp } = await import('../src/app.js');
const { config, readConfig } = await import('../src/config/env.js');
const { connectDatabase, disconnectDatabase } =
  await import('../src/config/database.js');
const { Employee } = await import('../src/models/Employee.js');
const { Enquiry } = await import('../src/models/Enquiry.js');
let mongo;
let app;
before(
  async () => {
    mongo = await MongoMemoryServer.create({
      binary: {
        version: '7.0.24',
        downloadDir: fileURLToPath(
          new URL('../.cache/mongodb', import.meta.url),
        ),
      },
    });
    await connectDatabase(mongo.getUri('crm_assignment_test'));
    await Promise.all([Employee.init(), Enquiry.init()]);
    app = createApp();
  },
  { timeout: 600000 },
);
after(async () => {
  await disconnectDatabase();
  await mongo?.stop();
});
beforeEach(async () => {
  await Promise.all([Employee.deleteMany({}), Enquiry.deleteMany({})]);
});
const employeeData = (email = 'counselor@example.com') => ({
  name: 'Test Counselor',
  email,
  password: 'StrongPassword123!',
});
const enquiryData = (name = 'Prospective Client') => ({
  name,
  email: 'prospect@example.com',
  phone: '+91 9876543210',
  courseInterest: 'Full Stack Development',
  message: 'Please share course details.',
});
async function counselor(email = 'counselor@example.com') {
  const registered = await request(app)
    .post('/api/auth/register')
    .send(employeeData(email));
  assert.equal(registered.status, 201);
  const loggedIn = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'StrongPassword123!' });
  assert.equal(loggedIn.status, 200);
  return {
    token: loggedIn.body.data.token,
    id: loggedIn.body.data.employee._id,
  };
}
const authenticated = (req, employee) =>
  req.set('Authorization', `Bearer ${employee.token}`);
async function submit(name) {
  const res = await request(app).post('/api/enquiries').send(enquiryData(name));
  assert.equal(res.status, 201);
  return res.body.data.enquiry;
}

test('Swagger serves local assets and a same-server specification with correct auth scope', async () => {
  const spec = await request(app).get('/api-docs.json').expect(200);
  assert.equal(spec.body.openapi, '3.0.3');
  assert.equal(spec.body.servers[0].url, '/');
  assert.equal(Object.keys(spec.body.paths).length, 8);
  assert.equal(spec.body.paths['/api/enquiries'].post.security, undefined);
  assert.deepEqual(spec.body.paths['/api/enquiries/public'].get.security, [{ bearerAuth: [] }]);
  const page = await request(app).get('/api-docs/').expect(200);
  assert.match(page.text, /swagger-ui-init.js/);
  const policy = page.headers['content-security-policy'];
  assert.match(policy, /script-src 'self' 'unsafe-inline'/);
  assert.doesNotMatch(policy, /upgrade-insecure-requests/);
  await request(app).get('/api-docs/swagger-ui-bundle.js').expect(200);
  const init = await request(app).get('/api-docs/swagger-ui-init.js').expect(200);
  assert.match(init.text, /CRM Developer Assignment API/);
  assert.match(init.text, /bearerAuth/);
  const health = await request(app).get('/api/health').expect(200);
  assert.doesNotMatch(health.headers['content-security-policy'], /script-src 'self' 'unsafe-inline'/);
});

test('registration normalizes email, hashes passwords, and never returns the hash', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      ...employeeData('  Counselor@Example.COM  '),
      name: '  Test Counselor  ',
    });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.employee.name, 'Test Counselor');
  assert.equal(res.body.data.employee.email, 'counselor@example.com');
  assert.equal('password' in res.body.data.employee, false);
  const stored = await Employee.findOne({
    email: 'counselor@example.com',
  }).select('+password');
  assert.notEqual(stored.password, employeeData().password);
  assert.equal(
    await bcrypt.compare(employeeData().password, stored.password),
    true,
  );
  assert.equal('password' in stored.toJSON(), false);
  const login = await request(app).post('/api/auth/login').send({
    email: 'COUNSELOR@EXAMPLE.COM',
    password: employeeData().password,
  });
  assert.equal(login.status, 200);
  assert.equal('password' in login.body.data.employee, false);
  const me = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${login.body.data.token}`);
  assert.equal(me.status, 200);
  assert.equal(me.body.data.employee.email, 'counselor@example.com');
  assert.equal('password' in me.body.data.employee, false);
});
test('concurrent duplicate registrations return exactly one 201 and one 409', async () => {
  const results = await Promise.all([
    request(app).post('/api/auth/register').send(employeeData()),
    request(app)
      .post('/api/auth/register')
      .send(employeeData('COUNSELOR@EXAMPLE.COM')),
  ]);
  assert.deepEqual(results.map((result) => result.status).sort(), [201, 409]);
  assert.equal(await Employee.countDocuments(), 1);
});
test('invalid registration, bcrypt byte overflow, login and operator injection are rejected', async () => {
  for (const body of [
    {},
    { ...employeeData(), name: ' ' },
    { ...employeeData(), email: { $ne: null } },
    { ...employeeData(), password: 'short' },
    { ...employeeData(), password: '🔐'.repeat(20) },
    { ...employeeData(), admin: true },
  ]) {
    const res = await request(app).post('/api/auth/register').send(body);
    assert.equal(res.status, 400);
    assert.equal(
      JSON.stringify(res.body).includes('StrongPassword123!'),
      false,
    );
  }
  await counselor();
  assert.equal(
    (
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'counselor@example.com', password: 'wrong' })
    ).status,
    401,
  );
  assert.equal(
    (
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'missing@example.com', password: 'wrong' })
    ).status,
    401,
  );
  assert.equal(
    (
      await request(app)
        .post('/api/auth/login')
        .send({ email: { $ne: null }, password: 'wrong' })
    ).status,
    400,
  );
});
test('missing, malformed, expired, wrong-issuer, wrong-algorithm, and deleted-user tokens return 401', async () => {
  const person = await counselor();
  const tokenOptions = {
    subject: person.id,
    issuer: 'crm-api',
    audience: 'crm-employees',
  };
  const tokens = [
    'not-a-jwt',
    jwt.sign({}, config.jwtSecret, { ...tokenOptions, expiresIn: -1 }),
    jwt.sign({}, config.jwtSecret, { ...tokenOptions, issuer: 'other-api' }),
    jwt.sign({}, config.jwtSecret, { ...tokenOptions, algorithm: 'HS384' }),
  ];
  for (const path of [
    '/api/auth/me',
    '/api/enquiries/public',
    '/api/enquiries/my',
  ]) {
    assert.equal((await request(app).get(path)).status, 401);
    for (const token of tokens)
      assert.equal(
        (await request(app).get(path).set('Authorization', `Bearer ${token}`))
          .status,
        401,
      );
  }
  assert.equal(
    (
      await request(app).patch(
        `/api/enquiries/${new mongoose.Types.ObjectId()}/claim`,
      )
    ).status,
    401,
  );
  await Employee.findByIdAndDelete(person.id);
  assert.equal(
    (await authenticated(request(app).get('/api/auth/me'), person)).status,
    401,
  );
});
test('public enquiry submission validates fields and prevents mass assignment', async () => {
  const good = await submit();
  assert.equal(good.claimedBy, null);
  assert.equal(good.courseInterest, 'Full Stack Development');
  const minimal = await request(app).post('/api/enquiries').send({
    name: 'Client Name',
    email: 'CLIENT@EXAMPLE.COM',
    courseInterest: 'React',
  });
  assert.equal(minimal.status, 201);
  assert.equal(minimal.body.data.enquiry.email, 'client@example.com');
  for (const body of [
    {},
    { ...enquiryData(), courseInterest: '' },
    { ...enquiryData(), phone: 'invalid' },
    { ...enquiryData(), message: 'a'.repeat(2001) },
    { ...enquiryData(), email: { $ne: null } },
    { ...enquiryData(), claimedBy: new mongoose.Types.ObjectId().toString() },
    { ...enquiryData(), name: ['not', 'text'] },
  ])
    assert.equal(
      (await request(app).post('/api/enquiries').send(body)).status,
      400,
    );
});
test('pagination and listing scope expose unclaimed leads and only the authenticated counselor’s own leads', async () => {
  const alice = await counselor('alice@example.com');
  const bob = await counselor('bob@example.com');
  const lead = await submit('Assigned Client');
  await submit('Public Client A');
  await submit('Public Client B');
  await submit('Public Client C');
  assert.equal(
    (
      await authenticated(
        request(app).patch(`/api/enquiries/${lead._id}/claim`),
        alice,
      )
    ).status,
    200,
  );
  const first = await authenticated(
    request(app).get('/api/enquiries/public?page=1&limit=2'),
    bob,
  );
  const second = await authenticated(
    request(app).get('/api/enquiries/public?page=2&limit=2'),
    alice,
  );
  assert.equal(first.status, 200);
  assert.deepEqual(first.body.pagination, {
    page: 1,
    limit: 2,
    total: 3,
    pages: 2,
  });
  assert.equal(first.body.data.enquiries.length, 2);
  assert.equal(second.body.data.enquiries.length, 1);
  const ids = [...first.body.data.enquiries, ...second.body.data.enquiries].map(
    (item) => item._id,
  );
  assert.equal(new Set(ids).size, 3);
  assert.equal(ids.includes(lead._id), false);
  const own = await authenticated(request(app).get('/api/enquiries/my'), alice);
  assert.equal(own.body.data.enquiries[0]._id, lead._id);
  assert.equal(own.body.data.enquiries.length, 1);
  const other = await authenticated(
    request(app).get(`/api/enquiries/my?claimedBy=${alice.id}`),
    bob,
  );
  assert.equal(other.status, 400);
  const otherOwn = await authenticated(
    request(app).get('/api/enquiries/my'),
    bob,
  );
  assert.equal(otherOwn.body.data.enquiries.length, 0);
  assert.equal(
    (await authenticated(request(app).get(`/api/enquiries/${lead._id}`), bob))
      .status,
    404,
  );
  for (const query of [
    'page=0',
    'page=abc',
    'limit=101',
    'limit=-1',
    'page[$gt]=1',
    'limit=1&limit=2',
  ])
    assert.equal(
      (
        await authenticated(
          request(app).get(`/api/enquiries/public?${query}`),
          alice,
        )
      ).status,
      400,
    );
});
test('claim errors distinguish invalid ID, absent lead and conflict without disclosing private data', async () => {
  const alice = await counselor('alice@example.com');
  const bob = await counselor('bob@example.com');
  const lead = await submit();
  assert.equal(
    (
      await authenticated(
        request(app).patch('/api/enquiries/not-an-id/claim'),
        alice,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await authenticated(
        request(app).patch(
          `/api/enquiries/${new mongoose.Types.ObjectId()}/claim`,
        ),
        alice,
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await authenticated(
        request(app)
          .patch(`/api/enquiries/${lead._id}/claim`)
          .send({ claimedBy: bob.id }),
        alice,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await authenticated(
        request(app).patch(`/api/enquiries/${lead._id}/claim`),
        alice,
      )
    ).status,
    200,
  );
  for (const person of [alice, bob]) {
    const conflict = await authenticated(
      request(app).patch(`/api/enquiries/${lead._id}/claim`),
      person,
    );
    assert.equal(conflict.status, 409);
    assert.equal('data' in conflict.body, false);
    assert.equal(JSON.stringify(conflict.body).includes(alice.id), false);
  }
  assert.equal(String((await Enquiry.findById(lead._id)).claimedBy), alice.id);
});
test('real MongoDB concurrent claiming has one winner and removes the enquiry from both public lists', async () => {
  const alice = await counselor('alice@example.com');
  const bob = await counselor('bob@example.com');
  for (let race = 0; race < 5; race++) {
    const lead = await submit(`Race Client ${race}`);
    const [a, b] = await Promise.all([
      authenticated(
        request(app).patch(`/api/enquiries/${lead._id}/claim`),
        alice,
      ),
      authenticated(
        request(app).patch(`/api/enquiries/${lead._id}/claim`),
        bob,
      ),
    ]);
    assert.deepEqual([a.status, b.status].sort(), [200, 409]);
    const winner = a.status === 200 ? alice : bob;
    const loser = a.status === 200 ? bob : alice;
    assert.equal(
      String((await Enquiry.findById(lead._id)).claimedBy),
      winner.id,
    );
    for (const person of [alice, bob]) {
      const list = await authenticated(
        request(app).get('/api/enquiries/public'),
        person,
      );
      assert.equal(
        list.body.data.enquiries.some((item) => item._id === lead._id),
        false,
      );
    }
    const owned = await authenticated(
      request(app).get('/api/enquiries/my'),
      winner,
    );
    const privateToOther = await authenticated(
      request(app).get('/api/enquiries/my'),
      loser,
    );
    assert.equal(
      owned.body.data.enquiries.some((item) => item._id === lead._id),
      true,
    );
    assert.equal(
      privateToOther.body.data.enquiries.some((item) => item._id === lead._id),
      false,
    );
  }
});
test('health, security headers, CORS allowlist, malformed JSON, oversized bodies and unknown routes', async () => {
  const health = await request(app).get('/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.data.database, 'connected');
  assert.ok(health.headers['x-content-type-options']);
  assert.ok(health.headers['x-request-id']);
  assert.equal(health.headers['x-powered-by'], undefined);
  const allowed = await request(app)
    .get('/api/health')
    .set('Origin', 'http://127.0.0.1:5173');
  assert.equal(
    allowed.headers['access-control-allow-origin'],
    'http://127.0.0.1:5173',
  );
  const blocked = await request(app)
    .get('/api/health')
    .set('Origin', 'https://untrusted.example');
  assert.equal(blocked.status, 403);
  assert.equal(blocked.headers['access-control-allow-origin'], undefined);
  const options = await request(app)
    .options('/api/enquiries')
    .set('Origin', 'http://127.0.0.1:5173')
    .set('Access-Control-Request-Method', 'POST');
  assert.equal(options.status, 204);
  assert.equal(
    (
      await request(app)
        .post('/api/enquiries')
        .set('Content-Type', 'application/json')
        .send('{bad')
    ).status,
    400,
  );
  assert.equal(
    (
      await request(app)
        .post('/api/enquiries')
        .send({ ...enquiryData(), message: 'x'.repeat(40000) })
    ).status,
    413,
  );
  assert.equal((await request(app).get('/api/missing')).status, 404);
});
test('unexpected failures return a sanitized 500 response without a stack or secret', async () => {
  const person = await counselor();
  const lead = await submit();
  const original = Enquiry.findOneAndUpdate;
  try {
    Enquiry.findOneAndUpdate = () => {
      throw new Error('Sensitive internal details and secret');
    };
    const res = await authenticated(
      request(app).patch(`/api/enquiries/${lead._id}/claim`),
      person,
    );
    assert.equal(res.status, 500);
    assert.equal(res.body.message, 'Internal server error.');
    assert.equal(JSON.stringify(res.body).includes('Sensitive'), false);
    assert.equal('stack' in res.body, false);
  } finally {
    Enquiry.findOneAndUpdate = original;
  }
});
test('configuration fails fast for placeholders, invalid CORS, unsafe rounds and invalid expiry', () => {
  for (const patch of [
    { JWT_SECRET: 'short' },
    { JWT_SECRET: 'replace-with-a-random-secret-of-at-least-32-characters' },
    { CORS_ORIGIN: '*' },
    { CORS_ORIGIN: 'http://localhost:5173/path' },
    { PORT: '0' },
    { JWT_EXPIRES_IN: 'forever' },
    { BCRYPT_SALT_ROUNDS: '1' },
  ])
    assert.throws(() => readConfig({ ...process.env, ...patch }));
  assert.equal(
    readConfig({ ...process.env, JWT_EXPIRES_IN: '3600' }).jwtExpiresIn,
    3600,
  );
});
