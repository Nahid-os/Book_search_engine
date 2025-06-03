// __tests__/components/BookCard.test.jsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import BookCard from '../../components/BookCard'

describe('BookCard', () => {
  const book = {
    title:            'My Book',
    author:           'Jane Doe',
    rating:            4.5,       // matches book.rating
    numRatings:       123,        // matches book.numRatings
    isbn13:           '',         // fallback cover
    max_genre:        [],         // no genres
    // description is unused by the component
  }

  test('renders title and author', () => {
    render(<BookCard book={book} />)
    expect(screen.getByText('My Book')).toBeInTheDocument()
    expect(screen.getByText(/by Jane Doe/)).toBeInTheDocument()
  })

  test('renders number of ratings', () => {
    render(<BookCard book={book} />)
    // the component renders "(123)" after the stars
    expect(screen.getByText('(123)')).toBeInTheDocument()
  })
})
