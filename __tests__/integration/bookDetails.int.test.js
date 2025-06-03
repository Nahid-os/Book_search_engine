// __tests__/integration/bookDetails.int.test.js

/**
 * Integration tests for the /api/book-details/:bookId endpoint.
 * Uses an in-memory MongoDB to exercise the aggregation pipeline in routes/bookDetails.js :contentReference[oaicite:0]{index=0}.
 */

const request = require('supertest')
const express = require('express')
const { MongoMemoryServer } = require('mongodb-memory-server')
const { MongoClient } = require('mongodb')
const bookDetailsRouter = require('../../routes/bookDetails')

let mongod, client, db, app

beforeAll(async () => {
  // Start in-memory MongoDB
  mongod = await MongoMemoryServer.create()
  client = new MongoClient(mongod.getUri())
  await client.connect()
  db = client.db('testdb')

  // Mount Express with the bookDetails router
  app = express()
  app.use(express.json())
  app.locals.db = db
  // Route path matches "/:bookId"
  app.use('/api/book-details', bookDetailsRouter)
})

afterAll(async () => {
  await client.close()
  await mongod.stop()
})

beforeEach(async () => {
  // Clear collections before each test
  await db.collection('books').deleteMany({})
  await db.collection('authors').deleteMany({})

  // Seed authors
  await db.collection('authors').insertMany([
    { author_id: 1, name: 'Alice Adams' },
    { author_id: 2, name: 'Bob Brown' }
  ])

  // Seed books
  await db.collection('books').insertMany([
    {
      book_id: 42,
      title: 'The Hitchhiker’s Guide',
      average_rating: 4.2,
      ratings_count: 42,
      description: 'Don’t Panic!',
      authors: [{ author_id: 1 }],
      publisher: 'Pan Galactic',
      publication_year: 1979,
      num_pages: 224,
      isbn13: '9780345391803',
      max_genre: ['Sci-Fi'],
      isbn: '0345391802',
      language_code: 'en',
      similar_books: [],
      url: 'https://example.com/h2g2'
    },
    {
      book_id: 99,
      title: 'Unknown Book',
      average_rating: 3.5,
      ratings_count: 10,
      description: 'Edge case',
      authors: [{ author_id: 999 }], // no matching authorDetails entry
      publisher: 'Nowhere',
      publication_year: 2000,
      num_pages: 100,
      isbn13: '0000000000000',
      max_genre: [],
      isbn: '0000000000',
      language_code: 'en',
      similar_books: [],
      url: ''
    }
  ])
})

test('GET /api/book-details/42 returns detailed book with authors joined by name', async () => {
  const res = await request(app).get('/api/book-details/42')
  expect(res.status).toBe(200)

  // The record for book_id 42 should be returned
  expect(res.body.book_id).toBe(42)
  expect(res.body.title).toBe('The Hitchhiker’s Guide')
  expect(res.body.average_rating).toBe(4.2)
  expect(res.body.ratings_count).toBe(42)
  expect(res.body.description).toBe('Don’t Panic!')

  // authorDetails lookup should produce "Alice Adams"
  expect(res.body.authors).toBe('Alice Adams')

  // Other projected fields should also be present
  expect(res.body.publisher).toBe('Pan Galactic')
  expect(res.body.publication_year).toBe(1979)
  expect(res.body.num_pages).toBe(224)
  expect(res.body.isbn13).toBe('9780345391803')
  expect(res.body.max_genre).toEqual(['Sci-Fi'])
  expect(res.body.isbn).toBe('0345391802')
  expect(res.body.language_code).toBe('en')
  expect(res.body.similar_books).toEqual([])
  expect(res.body.url).toBe('https://example.com/h2g2')
})

test('GET /api/book-details/:id returns 404 when book not found', async () => {
  const res = await request(app).get('/api/book-details/12345')
  expect(res.status).toBe(404)
  expect(res.body.error).toBe('Book not found')
})

test('GET /api/book-details/:id falls back to "Author" when no authorDetails match', async () => {
  const res = await request(app).get('/api/book-details/99')
  expect(res.status).toBe(200)

  // author_id 999 had no matching entry in authors collection
  // fallback in code sets authors to "Author"
  expect(res.body.authors).toBe('Author')
})
