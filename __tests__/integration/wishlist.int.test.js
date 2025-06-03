// __tests__/integration/wishlist.int.test.js

/**
 * Integration tests for the /api/wishlist endpoints.
 * Exercises add, retrieve, and remove operations against an in-memory MongoDB.
 */

const request = require('supertest')
const express = require('express')
const { MongoMemoryServer } = require('mongodb-memory-server')
const { MongoClient, ObjectId } = require('mongodb')
const wishlistRouter = require('../../routes/wishlist')

let mongod, client, db, app
let authenticated, testUserId

beforeAll(async () => {
  // Start in-memory MongoDB and connect
  mongod = await MongoMemoryServer.create()
  client = new MongoClient(mongod.getUri())
  await client.connect()
  db = client.db('testdb')

  // Express app with JSON parsing and auth‐simulation middleware
  app = express()
  app.use(express.json())
  app.locals.db = db

  // Auth middleware uses outer variables to simulate login state
  app.use((req, res, next) => {
    req.isAuthenticated = () => authenticated
    req.user = { _id: testUserId }
    next()
  })

  app.use('/api/wishlist', wishlistRouter)
})

afterAll(async () => {
  await client.close()
  await mongod.stop()
})

beforeEach(async () => {
  // Reset DB state and default auth
  authenticated = false
  testUserId = new ObjectId()
  await db.collection('wishlists').deleteMany({})
  await db.collection('books').deleteMany({})
  await db.collection('authors').deleteMany({})

  // Seed books and authors for GET endpoint
  await db.collection('books').insertMany([
    { book_id: 101, title: 'First', authors: [{ author_id: 'A1' }] },
    { book_id: 102, title: 'Second', authors: [{ author_id: 'A2' }] }
  ])
  await db.collection('authors').insertMany([
    { author_id: 'A1', name: 'Alice' },
    { author_id: 'A2', name: 'Bob' }
  ])
})

describe('POST /api/wishlist', () => {
  test('401 if not authenticated', async () => {
    const res = await request(app).post('/api/wishlist').send({ bookId: 101 })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('User not authenticated')
  })

  test('400 if missing bookId', async () => {
    authenticated = true
    const res = await request(app).post('/api/wishlist').send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Missing bookId in request')
  })

  test('200 on successful add and 400 on duplicate', async () => {
    authenticated = true

    // First add succeeds
    let res = await request(app).post('/api/wishlist').send({ bookId: 101 })
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Book added to wishlist')

    // Duplicate add fails
    res = await request(app).post('/api/wishlist').send({ bookId: 101 })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Book already in wishlist')
  })
})

describe('GET /api/wishlist', () => {
  test('401 if not authenticated', async () => {
    const res = await request(app).get('/api/wishlist')
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('User not authenticated')
  })

  test('200 and returns aggregated book details', async () => {
    authenticated = true
    // Prepopulate wishlist for the test user
    await db.collection('wishlists').insertMany([
      { userId: testUserId, bookId: 101, addedAt: new Date() },
      { userId: testUserId, bookId: 102, addedAt: new Date() }
    ])

    const res = await request(app).get('/api/wishlist')
    expect(res.status).toBe(200)

    // Response has a "wishlist" array with both book documents
    expect(Array.isArray(res.body.wishlist)).toBe(true)
    expect(res.body.wishlist).toHaveLength(2)

    // Verify lookup and projection
    const titles = res.body.wishlist.map(b => b.title).sort()
    expect(titles).toEqual(['First', 'Second'])
  })
})

describe('DELETE /api/wishlist/:bookId', () => {
  test('401 if not authenticated', async () => {
    const res = await request(app).delete('/api/wishlist/101')
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('User not authenticated')
  })

  test('404 if book not in wishlist', async () => {
    authenticated = true
    const res = await request(app).delete('/api/wishlist/999')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Book not found in wishlist')
  })

  test('200 on successful removal', async () => {
    authenticated = true
    // Add then remove
    await db.collection('wishlists').insertOne({
      userId: testUserId,
      bookId: 101,
      addedAt: new Date()
    })

    const res = await request(app).delete('/api/wishlist/101')
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Book removed from wishlist')

    // Confirm deletion
    const remaining = await db.collection('wishlists')
      .find({ userId: testUserId })
      .toArray()
    expect(remaining).toHaveLength(0)
  })
})
