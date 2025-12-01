import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import PrintPreview from '../../resources/js/pages/kiosk/print-preview'
import type { UploadInfo } from '../../resources/js/types/models/upload-info'

describe('PrintPreview Component', () => {
  const mockUploadInfo: UploadInfo = {
    filename: 'test-document.pdf',
    original_name: 'Test Document.pdf',
    path: '/storage/uploads/test-document.pdf',
    size: 1024 * 1024, // 1MB
    pages: 5,
    mime_type: 'application/pdf',
    preview_url: '/storage/uploads/test-document.pdf',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock successful fetch response
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          cost: 10.00,
          price_per_page: 2.00,
          total_pages: 5,
        }),
      } as Response)
    )
  })

  it('renders the component with correct title and document info', () => {
    render(<PrintPreview uploadInfo={mockUploadInfo} />)

    expect(screen.getByText('📄 Your Document is Ready')).toBeInTheDocument()
    expect(screen.getByText('Review settings and cost')).toBeInTheDocument()
    expect(screen.getByText('Test Document.pdf')).toBeInTheDocument()
    expect(screen.getByText('5 pages')).toBeInTheDocument()
    expect(screen.getByText('1.00 MB')).toBeInTheDocument()
  })

  it('displays PDF preview when preview_url is provided', () => {
    render(<PrintPreview uploadInfo={mockUploadInfo} />)

    const pdfViewer = screen.getByTestId('pdf-preview-viewer')
    expect(pdfViewer).toBeInTheDocument()
    expect(pdfViewer).toHaveAttribute('data-file-url', mockUploadInfo.preview_url)
  })

  it('calculates cost on component mount', async () => {
    render(<PrintPreview uploadInfo={mockUploadInfo} />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/kiosk/calculate-cost',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': 'test-csrf-token',
          }),
          body: JSON.stringify({
            pages: mockUploadInfo.pages,
            copies: 1,
            color_mode: 'bw',
          }),
        })
      )
    })
  })

  it('displays cost calculation results', async () => {
    // Mock successful cost calculation
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          cost: 10,
          price_per_page: 2,
          total_pages: 5,
        }),
      } as Response)
    )

    render(<PrintPreview uploadInfo={mockUploadInfo} />)

    await waitFor(() => {
      expect(screen.getByText('₱10.00')).toBeInTheDocument()
      expect(screen.getByText('₱2/page')).toBeInTheDocument()
      expect(screen.getByText('Total Pages')).toBeInTheDocument()
    })
  })

  it('shows loading state during cost calculation', () => {
    // Mock pending fetch
    global.fetch = vi.fn(() => new Promise<Response>(() => {})) // Never resolves

    render(<PrintPreview uploadInfo={mockUploadInfo} />)

    expect(screen.getByText('Calculating cost...')).toBeInTheDocument()
  })

  it('handles cost calculation errors', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      } as Response)
    )

    render(<PrintPreview uploadInfo={mockUploadInfo} />)

    await waitFor(() => {
      expect(screen.getByText('Failed to calculate cost (Error 500)')).toBeInTheDocument()
    })
  })

  it('handles network errors during cost calculation', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))

    render(<PrintPreview uploadInfo={mockUploadInfo} />)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('provides navigation back to upload page', () => {
    render(<PrintPreview uploadInfo={mockUploadInfo} />)

    const backButton = screen.getByTestId('arrow-left-icon').closest('a')
    expect(backButton).toHaveAttribute('href', '/kiosk/upload')
  })

  it('provides reset functionality', () => {
    render(<PrintPreview uploadInfo={mockUploadInfo} />)

    const resetLink = screen.getByText('🔄 Reset').closest('a')
    expect(resetLink).toHaveAttribute('href', '/kiosk/reset')
  })

  it('displays coin suggestions component', async () => {
    // Mock successful cost calculation
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          cost: 10,
          price_per_page: 2,
          total_pages: 5,
        }),
      } as Response)
    )

    render(<PrintPreview uploadInfo={mockUploadInfo} />)

    await waitFor(() => {
      const coinSuggestions = screen.getByTestId('coin-suggestions')
      expect(coinSuggestions).toBeInTheDocument()
      expect(coinSuggestions).toHaveAttribute('data-total-needed', '10')
    })
  })

  it('displays correct pricing for different color modes', async () => {
    // Mock successful cost calculation
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          cost: 10,
          price_per_page: 2,
          total_pages: 5,
        }),
      } as Response)
    )

    render(<PrintPreview uploadInfo={mockUploadInfo} />)

    await waitFor(() => {
      expect(screen.getByText('₱2/page')).toBeInTheDocument() // Black & White
      expect(screen.getByText('₱3/page')).toBeInTheDocument() // Grayscale
      expect(screen.getByText('₱5/page')).toBeInTheDocument() // Color
    })
  })

  it('shows retry button on calculation error', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server Error'),
      } as Response)
    )

    render(<PrintPreview uploadInfo={mockUploadInfo} />)

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })
  })
})