import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Inertia.js
vi.mock('@inertiajs/react', () => ({
  Head: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLTitleElement>>) => <title {...props}>{children}</title>,
  Link: ({ children, href, ...props }: React.PropsWithChildren<{ href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>>) => <a href={href} {...props}>{children}</a>,
  router: {
    visit: vi.fn(),
  },
  useRemember: vi.fn((initialValue: unknown) => {
    const setValue = vi.fn()
    return [initialValue, setValue]
  }),
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  },
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  Coins: () => <div data-testid="coins-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Printer: () => <div data-testid="printer-icon" />,
}))

// Mock kiosk routes
vi.mock('@/routes/kiosk', () => ({
  default: {
    upload: () => '/kiosk/upload',
    payment: () => '/kiosk/payment',
    calculateCost: {
      url: () => '/kiosk/calculate-cost'
    },
    reset: () => '/kiosk/reset',
  },
}))

// Mock PDF preview component
vi.mock('@/components/pdf-preview-viewer', () => ({
  default: ({ fileUrl }: { fileUrl: string }) => (
    <div data-testid="pdf-preview-viewer" data-file-url={fileUrl}>
      PDF Preview
    </div>
  ),
}))

// Mock coin suggestions component
vi.mock('@/components/coin-suggestions', () => ({
  default: ({ totalNeeded }: { totalNeeded: number }) => (
    <div data-testid="coin-suggestions" data-total-needed={totalNeeded}>
      Coin Suggestions
    </div>
  ),
}))

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => <button {...props}>{children}</button>,
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
}))

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: React.PropsWithChildren<React.LabelHTMLAttributes<HTMLLabelElement>>) => <label {...props}>{children}</label>,
}))

vi.mock('@/components/ui/radio-group', () => ({
  RadioGroup: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  RadioGroupItem: ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => <input type="radio" {...props} />,
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  SelectContent: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  SelectItem: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  SelectTrigger: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  SelectValue: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <span {...props}>{children}</span>,
}))

// Global test utilities
// Note: fetch is mocked per-test where needed

global.sessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}

// Mock CSRF token meta tag
const csrfMeta = document.createElement('meta')
csrfMeta.name = 'csrf-token'
csrfMeta.content = 'test-csrf-token'
document.head.appendChild(csrfMeta)