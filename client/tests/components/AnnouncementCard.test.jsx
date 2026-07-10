import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AnnouncementCard from '../../src/components/AnnouncementCard';
import * as LanguageContext from '../../src/context/LanguageContext';

vi.mock('../../src/context/LanguageContext');

const mockT = vi.fn((key) => {
  const translations = {
    'announcements.readMore': 'Read More',
  };
  return translations[key] || key;
});

const mockFormatDateShort = vi.fn((dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
});

function Wrapper({ children }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('AnnouncementCard', () => {
  beforeEach(() => {
    vi.mocked(LanguageContext.useTranslation).mockReturnValue({
      t: mockT,
      formatDateShort: mockFormatDateShort,
      locale: 'en',
      setLocale: vi.fn(),
      formatDate: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sampleAnnouncement = {
    id: 42,
    title: 'School Holiday Notice',
    content: 'The school will be closed next Monday for the public holiday.',
    created_at: '2026-03-15T10:00:00Z',
    author_name: 'Principal',
  };

  it('renders announcement title and date', () => {
    render(
      <Wrapper>
        <AnnouncementCard announcement={sampleAnnouncement} />
      </Wrapper>
    );

    expect(screen.getByText('School Holiday Notice')).toBeInTheDocument();
    expect(screen.getByText('Mar 15, 2026')).toBeInTheDocument();
  });

  it('renders author name', () => {
    render(
      <Wrapper>
        <AnnouncementCard announcement={sampleAnnouncement} />
      </Wrapper>
    );

    expect(screen.getByText('Principal')).toBeInTheDocument();
  });

  it('links to the correct announcement detail page', () => {
    render(
      <Wrapper>
        <AnnouncementCard announcement={sampleAnnouncement} />
      </Wrapper>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/announcements/42');
  });

  it('handles missing data gracefully', () => {
    const sparseAnnouncement = {
      id: 1,
      title: 'Quick Update',
      content: '',
      created_at: '2026-01-01T00:00:00Z',
      author_name: '',
    };

    render(
      <Wrapper>
        <AnnouncementCard announcement={sparseAnnouncement} />
      </Wrapper>
    );

    expect(screen.getByText('Quick Update')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/announcements/1');
  });
});
