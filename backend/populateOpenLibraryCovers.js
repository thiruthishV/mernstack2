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
    .trim();
};

const fetchCovers = async () => {
  try {
    await connectDB();
    const books = await Book.find({});
    console.log(`Found ${books.length} books in catalog.`);

    let matched = 0;
    let fallback = 0;

    // Process in batches of 5 with delay to respect OpenLibrary rate limits
    const batchSize = 5;
    for (let i = 0; i < books.length; i += batchSize) {
      const batch = books.slice(i, i + batchSize);
      console.log(`Processing books ${i + 1} to ${Math.min(i + batchSize, books.length)} of ${books.length}...`);

      await Promise.all(
        batch.map(async (book) => {
          try {
            const query = cleanTitleForSearch(book.title);
            const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=1`;
            
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 6000);

            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);

            if (res.ok) {
              const data = await res.json();
              if (data.docs && data.docs.length > 0 && data.docs[0].cover_i) {
                const coverId = data.docs[0].cover_i;
                book.coverImage = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
                await book.save();
                matched++;
                console.log(`  ✓ Matched: "${book.title}" -> Cover ID: ${coverId}`);
                return;
              }
            }
          } catch (err) {
            // timeout or error
          }
          fallback++;
        })
      );

      // Brief delay between batches
      await new Promise((r) => setTimeout(r, 400));
    }

    console.log('==============================================');
    console.log(`Done! Matched with OpenLibrary covers: ${matched}`);
    console.log(`Remaining: ${fallback}`);
    console.log('==============================================');
    process.exit(0);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

fetchCovers();
