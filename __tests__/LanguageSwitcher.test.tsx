import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import LanguageSwitcher from '@/components/LanguageSwitcher'

const mockReplace = jest.fn()

// next-intl/navigation をモック
jest.mock('@/i18n/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace: mockReplace }),
}))

function renderWithIntl(locale: string) {
  return render(
    <NextIntlClientProvider locale={locale} messages={{}}>
      <LanguageSwitcher />
    </NextIntlClientProvider>
  )
}

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    mockReplace.mockClear()
  })

  it('EN / JA / ZH の3ボタンを表示する', () => {
    renderWithIntl('en')
    expect(screen.getByText('EN')).toBeInTheDocument()
    expect(screen.getByText('JA')).toBeInTheDocument()
    expect(screen.getByText('ZH')).toBeInTheDocument()
  })

  it('現在のロケール（en）のボタンがハイライトされる', () => {
    renderWithIntl('en')
    const enButton = screen.getByText('EN')
    expect(enButton).toHaveClass('bg-white')
  })

  it('現在のロケール（ja）のボタンがハイライトされる', () => {
    renderWithIntl('ja')
    const jaButton = screen.getByText('JA')
    expect(jaButton).toHaveClass('bg-white')
  })

  it('JA ボタンをクリックすると router.replace が呼ばれる', async () => {
    renderWithIntl('en')
    await userEvent.click(screen.getByText('JA'))
    expect(mockReplace).toHaveBeenCalledWith('/', { locale: 'ja' })
  })
})
