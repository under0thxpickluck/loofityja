import { fireEvent, render, screen } from '@testing-library/react'
import GuideFaqAccordion from '@/components/GuideFaqAccordion'

const items = [
  { q: 'Question 1', a: 'Answer 1' },
  { q: 'Question 2', a: 'Answer 2' },
]

describe('GuideFaqAccordion', () => {
  it('全項目が最初は閉じた状態', () => {
    render(<GuideFaqAccordion items={items} />)
    expect(screen.queryByText('Answer 1')).not.toBeInTheDocument()
    expect(screen.queryByText('Answer 2')).not.toBeInTheDocument()
  })

  it('クリックで項目が展開される', () => {
    render(<GuideFaqAccordion items={items} />)
    fireEvent.click(screen.getByText('Question 1'))
    expect(screen.getByText('Answer 1')).toBeInTheDocument()
  })

  it('同じ項目を再クリックで閉じる', () => {
    render(<GuideFaqAccordion items={items} />)
    fireEvent.click(screen.getByText('Question 1'))
    expect(screen.getByText('Answer 1')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Question 1'))
    expect(screen.queryByText('Answer 1')).not.toBeInTheDocument()
  })

  it('別の項目をクリックすると開いていた項目が閉じる', () => {
    render(<GuideFaqAccordion items={items} />)
    fireEvent.click(screen.getByText('Question 1'))
    expect(screen.getByText('Answer 1')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Question 2'))
    expect(screen.queryByText('Answer 1')).not.toBeInTheDocument()
    expect(screen.getByText('Answer 2')).toBeInTheDocument()
  })
})
