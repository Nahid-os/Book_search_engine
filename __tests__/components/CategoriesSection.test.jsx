// __tests__/components/CategoriesSection.test.jsx

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock lucide-react icons so Jest does not parse untranspiled ESM
jest.mock('lucide-react', () => ({
  ChevronLeft:  () => <span data-testid="chevron-left" />,
  ChevronRight: () => <span data-testid="chevron-right" />
}))

// Stub BookCard and SkeletonLoader to focus on CategoriesSection logic
jest.mock('../../components/BookCard', () => ({ book }) => (
  <div data-testid={`bookcard-${book.id}`} />
))
jest.mock('../../components/SkeletonLoader', () => () => (
  <div data-testid="skeleton" />
))

import { CategoriesSection } from '../../components/CategoriesSection'

describe('CategoriesSection component', () => {
  const categories = ['Fiction', 'History']
  const allBooks = [
    { id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }
  ]

  test('renders category filter buttons and toggles selection', () => {
    const onCategoryClick = jest.fn()
    const { rerender } = render(
      <CategoriesSection
        categories={categories}
        allBooks={[]}
        selectedCategory={null}
        onCategoryClick={onCategoryClick}
        onAddToWishlist={jest.fn()}
        onRemoveFromWishlist={jest.fn()}
        onViewDetails={jest.fn()}
        wishlistIds={new Set()}
        booksPerPage={3}
        categoryCurrentPage={0}
        categoryTotalPages={1}
        goToPreviousCategoryPage={jest.fn()}
        goToNextCategoryPage={jest.fn()}
        isLoading={false}
      />
    )

    const fictionBtn = screen.getByRole('button', { name: 'Fiction' })
    fireEvent.click(fictionBtn)
    expect(onCategoryClick).toHaveBeenLastCalledWith('Fiction')

    // Rerender as if 'Fiction' is selected
    rerender(
      <CategoriesSection
        categories={categories}
        allBooks={[]}
        selectedCategory="Fiction"
        onCategoryClick={onCategoryClick}
        onAddToWishlist={jest.fn()}
        onRemoveFromWishlist={jest.fn()}
        onViewDetails={jest.fn()}
        wishlistIds={new Set()}
        booksPerPage={3}
        categoryCurrentPage={0}
        categoryTotalPages={1}
        goToPreviousCategoryPage={jest.fn()}
        goToNextCategoryPage={jest.fn()}
        isLoading={false}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Fiction' }))
    expect(onCategoryClick).toHaveBeenLastCalledWith(null)
  })

  test('shows skeleton loaders when isLoading is true', () => {
    render(
      <CategoriesSection
        categories={categories}
        allBooks={allBooks}
        selectedCategory="Fiction"
        onCategoryClick={jest.fn()}
        onAddToWishlist={jest.fn()}
        onRemoveFromWishlist={jest.fn()}
        onViewDetails={jest.fn()}
        wishlistIds={new Set()}
        booksPerPage={2}
        categoryCurrentPage={0}
        categoryTotalPages={2}
        goToPreviousCategoryPage={jest.fn()}
        goToNextCategoryPage={jest.fn()}
        isLoading={true}
      />
    )

    expect(screen.getAllByTestId('skeleton')).toHaveLength(2)
  })

  test('renders book cards with pagination controls when loaded', () => {
    const goPrev = jest.fn()
    const goNext = jest.fn()

    render(
      <CategoriesSection
        categories={categories}
        allBooks={allBooks}
        selectedCategory="History"
        onCategoryClick={jest.fn()}
        onAddToWishlist={jest.fn()}
        onRemoveFromWishlist={jest.fn()}
        onViewDetails={jest.fn()}
        wishlistIds={new Set(['1','3'])}
        booksPerPage={2}
        categoryCurrentPage={0}
        categoryTotalPages={2}
        goToPreviousCategoryPage={goPrev}
        goToNextCategoryPage={goNext}
        isLoading={false}
      />
    )

    const cards = screen.getAllByTestId(/^bookcard-/)
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveAttribute('data-testid', 'bookcard-1')
    expect(cards[1]).toHaveAttribute('data-testid', 'bookcard-2')

    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()

    const prevBtn = screen.getByRole('button', { name: /Previous category page/i })
    const nextBtn = screen.getByRole('button', { name: /Next category page/i })
    expect(prevBtn).toBeDisabled()
    expect(nextBtn).toBeEnabled()

    fireEvent.click(nextBtn)
    expect(goNext).toHaveBeenCalled()
  })

  test('shows empty-state message when no books in selected category', () => {
    render(
      <CategoriesSection
        categories={categories}
        allBooks={[]}
        selectedCategory="History"
        onCategoryClick={jest.fn()}
        onAddToWishlist={jest.fn()}
        onRemoveFromWishlist={jest.fn()}
        onViewDetails={jest.fn()}
        wishlistIds={new Set()}
        booksPerPage={2}
        categoryCurrentPage={0}
        categoryTotalPages={1}
        goToPreviousCategoryPage={jest.fn()}
        goToNextCategoryPage={jest.fn()}
        isLoading={false}
      />
    )

    expect(
      screen.getByText('No books found in the "History" category.')
    ).toBeInTheDocument()
  })
})
```