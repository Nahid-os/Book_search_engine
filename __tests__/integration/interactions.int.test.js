// __tests__/integration/interactions.int.test.js

/**
 * Integration tests for the /api/interactions endpoint.
 * Verifies authentication guard, validation, and insertion into MongoDB.
 */

const request = require('supertest')
const express = require('express')
const { MongoMemoryServer } = require('mongodb-memory-server')
const { MongoClient, ObjectId } = require('mongodb')
const interactionsRouter = require('../../routes/interactions')

let mongod, client, db, app
let authenticated, testUserId

beforeAll(async () => {
  // Start in-memory MongoDB and connect
  mongod = await MongoMemoryServer.create()
  client = new MongoClient(mongod.getUri())
  await client.connect()
  db = client.db('testdb')

  // Set up an Express app and mount the router
  app = express()
  app.use(express.json())
  app.locals.db = db

  // Simulate Passport-style authentication
  app.use((req, res, next) => {
    req.isAuthenticated = () => authenticated
    req.user = { _id: testUserId }
    next()
  })

  app.use('/api/interactions', interactionsRouter)
})

afterAll(async () => {
  await client.close()
  await mongod.stop()
})

beforeEach(async () => {
  // Reset auth flag and user ID
  authenticated = false
  testUserId = new ObjectId()

  // Clear the interactions collection
  await db.collection('interactions').deleteMany({})
})

test('401 if not authenticated', async () => {
  const res = await request(app)
    .post('/api/interactions')
    .send({ event: 'view_details', bookId: 42 })

  expect(res.status).toBe(401)
  expect(res.body.error).toBe('User not authenticated')
})

test('400 if missing event or bookId in body', async () => {
  authenticated = true

  // missing both fields
  const res = await request(app)
    .post('/api/interactions')
    .send({})

  expect(res.status).toBe(400)
  expect(res.body.error).toBe("Missing 'event' or 'bookId' in request body")
})

test('200 on valid request and stores interaction', async () => {
  authenticated = true
  const payload = { event: 'open_book', bookId: 123 }

  const res = await request(app)
    .post('/api/interactions')
    .send(payload)

  expect(res.status).toBe(200)
  expect(res.body.message).toBe('Interaction logged')

  // Verify that the document was inserted
  const doc = await db.collection('interactions').findOne({
    userId: testUserId,
    event: payload.event,
    bookId: payload.bookId
  })

  expect(doc).not.toBeNull()
  expect(doc).toMatchObject({
    userId: testUserId,
    event: payload.event,
    bookId: payload.bookId
  })
  expect(doc.timestamp).toBeInstanceOf(Date)
})
