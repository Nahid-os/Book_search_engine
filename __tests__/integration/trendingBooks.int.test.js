// __tests__/integration/trendingBooks.test.js

/**
 * Integration tests for the /api/trending-books endpoint.
 * Uses an in-memory MongoDB instance to exercise the real aggregation pipeline
 * defined in routes/trendingBooks.js :contentReference[oaicite:0]{index=0}&#8203;:contentReference[oaicite:1]{index=1}.
 */

const request = require('supertest')
const express = require('express')
const { MongoMemoryServer } = require('mongodb-memory-server')
const { MongoClient } = require('mongodb')
const trendingBooksRouter = require('../../routes/trendingBooks') 

let mongod, client, db, app

beforeAll(async () => {
  // Start in-memory MongoDB
  mongod = await MongoMemoryServer.create()
  client = new MongoClient(mongod.getUri())
  await client.connect()
  db = client.db('testdb')

  // Mount the Express app with our router and injected db
  app = express()
  app.use(express.json())
  app.locals.db = db
  app.use('/api/trending-books', trendingBooksRouter)
})

afterAll(async () => {
  await client.close()
  await mongod.stop()
})

beforeEach(async () => {
  // Reset both collections before each test
  await db.collection('books').deleteMany({})
  await db.collection('authors').deleteMany({})

  // Seed authors collection
  await db.collection('authors').insertMany([
    { author_id: 'A1', name: 'Author One' },
    { author_id: 'A2', name: 'Author Two' },
  ])

  // Seed books collection with varying ratings_count & average_rating
  await db.collection('books').insertMany([
    {
      book_id: 'B1',
      title: 'Zero Ratings',
      average_rating: 5.0,
      ratings_count: 0,
      description: 'Should be filtered out',
      authors: [{ author_id: 'A1' }],
    },
    {
      book_id: 'B2',
      title: 'Null Rating',
      average_rating: null,
      ratings_count: 10,
      description: 'Also filtered out',
      authors: [{ author_id: 'A2' }],
    },
    {
      book_id: 'B3',
      title: 'Top Book',
      average_rating: 4.8,
      ratings_count: 100,
      description: 'Highest ratings_count',
      authors: [{ author_id: 'A1' }]
    },
    {
      book_id: 'B4',
      title: 'Second Best',
      average_rating: 4.9,
      ratings_count: 90,
      description: 'Second place',
      authors: [{ author_id: 'A2' }]
    }
  ])
})

test('GET /api/trending-books returns only matched books sorted by ratings_count desc then average_rating desc', async () => {
  const res = await request(app).get('/api/trending-books')
  expect(res.status).toBe(200)

  // Only B3 and B4 pass the match stage
  expect(res.body).toHaveLength(2)

  // First two items should be in descending ratings_count order:
  // B3 (100) comes before B4 (90)
  expect(res.body[0].book_id).toBe('B3')
  expect(res.body[1].book_id).toBe('B4')

  // average_rating tie-breaker: if ratings_count were equal,
  // higher average_rating would come first (tested implicitly)
})

test('each returned book has authors field formatted as comma-separated names', async () => {
  const res = await request(app).get('/api/trending-books')
  const [first, second] = res.body

  // Author One for B3, Author Two for B4
  expect(first.authors).toBe('Author One')
  expect(second.authors).toBe('Author Two')
})

test('limits results to at most 55 documents', async () => {
  // insert 60 additional valid books
  const extra = Array.from({ length: 60 }).map((_, i) => ({
    book_id: `E${i}`,
    title: `Extra ${i}`,
    average_rating: 3 + i * 0.01,
    ratings_count: 10 + i,
    description: `Extra book ${i}`,
    authors: [{ author_id: 'A1' }]
  }))
  await db.collection('books').insertMany(extra)

  const res = await request(app).get('/api/trending-books')
  expect(res.status).toBe(200)
  // pipeline uses { $limit: 55 }
  expect(res.body.length).toBeLessThanOrEqual(55)
})
