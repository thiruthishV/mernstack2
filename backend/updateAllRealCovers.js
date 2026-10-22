import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Book } from './models/Book.js';
import { connectDB } from './config/db.js';

dotenv.config();

const cleanTitleForSearch = (title) => {
  return title
    .replace(/[—–-].*$/, '') // remove subtitle after dash
    .replace(/\(.*?\)/g, '') // remove parentheses
    .replace(/[:].*$/, '') // remove subtitle after colon
    .replace(/\s+/g, ' ')
    .trim();
};

const getCategoryGradient = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('program') || cat.includes('computer') || cat.includes('software')) {
    return ['#0f172a', '#1e293b', '#0284c7'];
  }
  if (cat.includes('web') || cat.includes('javascript')) {
    return ['#1e1b4b', '#312e81', '#6366f1'];
  }
  if (cat.includes('ai') || cat.includes('intelligence') || cat.includes('data')) {
    return ['#064e3b', '#047857', '#10b981'];
  }
  if (cat.includes('fiction') || cat.includes('novel') || cat.includes('literature')) {
    return ['#4c0519', '#881337', '#e11d48'];
  }
  if (cat.includes('science') || cat.includes('math') || cat.includes('physics')) {
    return ['#1e293b', '#334155', '#38bdf8'];
  }
  if (cat.includes('history') || cat.includes('philosophy') || cat.includes('biography')) {
    return ['#451a03', '#78350f', '#d97706'];
  }
  return ['#18181b', '#27272a', '#14b8a6'];
};

const generateSvgCover = (title, author, category) => {
  const [c1, c2, accent] = getCategoryGradient(category);
  const cleanTitle = (title || 'Book Title').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const cleanAuthor = (author || 'Author').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const cleanCategory = (category || 'Library').toUpperCase().replace(/&/g, '&amp;');

  const words = cleanTitle.split(' ');
  let line1 = '';
  let line2 = '';
  let line3 = '';
  for (const w of words) {
    if ((line1 + ' ' + w).length < 18) {
      line1 += (line1 ? ' ' : '') + w;
    } else if ((line2 + ' ' + w).length < 20) {
      line2 += (line2 ? ' ' : '') + w;
    } else if ((line3 + ' ' + w).length < 22) {
      line3 += (line3 ? ' ' : '') + w;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="50%" stop-color="${c2}" />
      <stop offset="100%" stop-color="${c1}" />
    </linearGradient>
  </defs>
  <rect width="400" height="600" fill="url(#bg)" />
  <rect x="25" y="25" width="350" height="550" rx="16" fill="none" stroke="${accent}" stroke-width="2" stroke-opacity="0.4" />
  <rect x="35" y="45" width="80" height="6" rx="3" fill="${accent}" />
  <text x="35" y="80" fill="${accent}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" letter-spacing="2">${cleanCategory}</text>
  <text x="35" y="180" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="800">
    <tspan x="35" dy="0">${line1}</tspan>
    ${line2 ? `<tspan x="35" dy="36">${line2}</tspan>` : ''}
    ${line3 ? `<tspan x="35" dy="36">${line3}</tspan>` : ''}
  </text>
  <line x1="35" y1="360" x2="120" y2="360" stroke="${accent}" stroke-width="3" stroke-linecap="round" />
  <text x="35" y="400" fill="#cbd5e1" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="500">By ${cleanAuthor}</text>
  <text x="35" y="530" fill="#64748b" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" letter-spacing="1">LIBRIO EXCLUSIVE EDITION</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

async function fetchRealCover(title, author, category) {
  const query = cleanTitleForSearch(title);

  // 1. Try OpenLibrary Search
  try {
    const olUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=1`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(olUrl, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const doc = data.docs && data.docs[0];
      if (doc && doc.cover_i) {
        return `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
      }
      if (doc && doc.isbn && doc.isbn[0]) {
        return `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-M.jpg`;
      }
    }
  } catch (e) {
    // OpenLibrary timed out or network error
  }

  // 2. Try Google Books API
  try {
    const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query + ' ' + (author || ''))}&maxResults=1`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(gbUrl, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const item = data.items && data.items[0];
      const thumb = item?.volumeInfo?.imageLinks?.thumbnail || item?.volumeInfo?.imageLinks?.smallThumbnail;
      if (thumb) {
        return thumb.replace(/^http:\/\//, 'https://');
      }
    }
  } catch (e) {
    // Google Books error
  }

  // 3. Fallback: Distinct stylized SVG cover showing book title and author
  return generateSvgCover(title, author, category);
}

const updateAllBooks = async () => {
  try {
    await connectDB();
    const books = await Book.find({});
    console.log(`Starting cover update for ${books.length} books in library...`);

    let updatedCount = 0;
    let openLibraryCount = 0;
    let googleBooksCount = 0;
    let svgCoverCount = 0;

    const batchSize = 6;
    for (let i = 0; i < books.length; i += batchSize) {
      const batch = books.slice(i, i + batchSize);
      console.log(`\nProcessing books ${i + 1} to ${Math.min(i + batchSize, books.length)} of ${books.length}...`);

      await Promise.all(
        batch.map(async (book) => {
          try {
            const newCover = await fetchRealCover(book.title, book.author, book.category);
            book.coverImage = newCover;
            await book.save();
            updatedCount++;

            if (newCover.includes('openlibrary.org')) {
              openLibraryCount++;
              console.log(`  [OL] ${book.title.slice(0, 35)}`);
            } else if (newCover.includes('google')) {
              googleBooksCount++;
              console.log(`  [GB] ${book.title.slice(0, 35)}`);
            } else {
              svgCoverCount++;
              console.log(`  [SVG] ${book.title.slice(0, 35)}`);
            }
          } catch (err) {
            console.error(`  [ERR] ${book.title}: ${err.message}`);
          }
        })
      );

      // Brief delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    console.log('\n======================================================');
    console.log(`✅ All book covers updated successfully!`);
    console.log(`Total books updated: ${updatedCount}`);
    console.log(`- OpenLibrary Real Covers: ${openLibraryCount}`);
    console.log(`- Google Books Real Covers: ${googleBooksCount}`);
    console.log(`- Distinct Title/Author SVG Covers: ${svgCoverCount}`);
    console.log('======================================================');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error during update:', error);
    process.exit(1);
  }
};

updateAllBooks();
