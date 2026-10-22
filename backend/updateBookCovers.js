import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Book } from './models/Book.js';
import { connectDB } from './config/db.js';

dotenv.config();

// Curated high quality topic-specific cover images
const imageDatabase = {
  python: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600',
  java: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600',
  c_cpp: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&q=80&w=600',
  javascript_web: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=600',
  rust_go: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600',
  algorithms: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=600',
  ai_ml: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600',
  data_science: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600',
  database_sql: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=600',
  networking: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=600',
  cyber_security: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=600',
  electronics: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600',
  math: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=600',
  competitive_aptitude: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600',
  fiction_novel: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
  history_geography: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=600',
  business_finance: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600',
  self_development: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=600',
  biography: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&q=80&w=600',
  children_books: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600',
  medical_health: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=600',
  law_politics: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=600',
  agriculture: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&q=80&w=600',
  arts_crafts: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=600',
  lifestyle_cooking: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=600',
  science_physics: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=600',
  education_study: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=600',
  languages_literature: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=600',
};

// Function to determine best matching image based on title and category
const getMatchingImage = (title, category) => {
  const t = title.toLowerCase();
  const c = category.toLowerCase();

  // Python
  if (t.includes('python')) return imageDatabase.python;

  // Java
  if (t.includes('java ') || t.startsWith('java') || t.includes('core java') || t.includes('effective java')) {
    return imageDatabase.java;
  }

  // C / C++
  if (t.includes('c++') || t.includes('let us c') || t.includes('ansi c') || t.includes('c primer') || t.includes('c programming')) {
    return imageDatabase.c_cpp;
  }

  // JavaScript / TypeScript / React / Node / Web
  if (
    t.includes('javascript') ||
    t.includes('typescript') ||
    t.includes('react') ||
    t.includes('node') ||
    t.includes('express') ||
    t.includes('vue') ||
    t.includes('angular') ||
    t.includes('html') ||
    t.includes('css') ||
    c.includes('web development')
  ) {
    return imageDatabase.javascript_web;
  }

  // Rust / Go / Kotlin
  if (t.includes('rust') || t.includes('go ') || t.includes('golang') || t.includes('kotlin')) {
    return imageDatabase.rust_go;
  }

  // Algorithms & Data Structures
  if (t.includes('algorithm') || t.includes('data structure') || t.includes('grokking')) {
    return imageDatabase.algorithms;
  }

  // AI / ML / Deep Learning / Neural / Vision / NLP
  if (
    t.includes('intelligence') ||
    t.includes('deep learning') ||
    t.includes('machine learning') ||
    t.includes('neural') ||
    t.includes('computer vision') ||
    t.includes('natural language') ||
    t.includes('generative') ||
    t.includes('robotics') ||
    c.includes('artificial intelligence')
  ) {
    return imageDatabase.ai_ml;
  }

  // Data Science & Big Data
  if (
    t.includes('data science') ||
    t.includes('data analysis') ||
    t.includes('big data') ||
    t.includes('mining') ||
    t.includes('data visualization') ||
    c.includes('data science')
  ) {
    return imageDatabase.data_science;
  }

  // Database / SQL / MongoDB / Redis / MySQL / Oracle
  if (
    t.includes('database') ||
    t.includes('sql') ||
    t.includes('mongodb') ||
    t.includes('redis') ||
    t.includes('mysql') ||
    t.includes('oracle') ||
    t.includes('data-intensive') ||
    c.includes('database')
  ) {
    return imageDatabase.database_sql;
  }

  // Cyber Security & Hacking
  if (
    t.includes('security') ||
    t.includes('hack') ||
    t.includes('malware') ||
    t.includes('forensics') ||
    t.includes('cryptography') ||
    t.includes('metasploit') ||
    t.includes('penetration') ||
    c.includes('cyber security')
  ) {
    return imageDatabase.cyber_security;
  }

  // Networking
  if (
    t.includes('network') ||
    t.includes('ccna') ||
    t.includes('tcp/ip') ||
    t.includes('cisco') ||
    t.includes('ethernet') ||
    t.includes('ipv6') ||
    c.includes('networking')
  ) {
    return imageDatabase.networking;
  }

  // Electronics & Hardware & Embedded
  if (
    t.includes('electronic') ||
    t.includes('circuit') ||
    t.includes('vlsi') ||
    t.includes('microprocessor') ||
    t.includes('embedded') ||
    t.includes('digital design') ||
    t.includes('fpga') ||
    t.includes('semiconductor') ||
    c.includes('electronics')
  ) {
    return imageDatabase.electronics;
  }

  // Competitive Exams & Aptitude (R.S. Aggarwal, Arun Sharma, Quicker Maths, Reasoning)
  if (
    t.includes('aptitude') ||
    t.includes('reasoning') ||
    t.includes('quicker maths') ||
    t.includes('competitive') ||
    t.includes('cat ') ||
    t.includes('upsc') ||
    t.includes('ssc ') ||
    t.includes('banking') ||
    t.includes('recruitment') ||
    t.includes('r.s. aggarwal') ||
    t.includes('arun sharma') ||
    c.includes('competitive')
  ) {
    return imageDatabase.competitive_aptitude;
  }

  // Mathematics
  if (
    t.includes('calculus') ||
    t.includes('algebra') ||
    t.includes('differential') ||
    t.includes('geometry') ||
    t.includes('statistics') ||
    t.includes('probability') ||
    t.includes('discrete math') ||
    c.includes('mathematics')
  ) {
    return imageDatabase.math;
  }

  // Health & Medical
  if (
    t.includes('anatomy') ||
    t.includes('physiology') ||
    t.includes('pathology') ||
    t.includes('microbiology') ||
    t.includes('medical') ||
    t.includes('clinical') ||
    t.includes('medicine') ||
    t.includes('nutrition') ||
    c.includes('health') ||
    c.includes('medical')
  ) {
    return imageDatabase.medical_health;
  }

  // Law & Politics
  if (
    t.includes('constitution') ||
    t.includes('penal') ||
    t.includes('contract act') ||
    t.includes('torts') ||
    t.includes('law') ||
    t.includes('human rights') ||
    c.includes('law') ||
    c.includes('politics')
  ) {
    return imageDatabase.law_politics;
  }

  // Agriculture & Environment
  if (
    t.includes('agronomy') ||
    t.includes('agriculture') ||
    t.includes('soil') ||
    t.includes('plant') ||
    t.includes('ecology') ||
    t.includes('farming') ||
    t.includes('environmental') ||
    c.includes('agriculture') ||
    c.includes('environment')
  ) {
    return imageDatabase.agriculture;
  }

  // Arts & Drawing
  if (
    t.includes('drawing') ||
    t.includes('painting') ||
    t.includes('art book') ||
    t.includes('origami') ||
    t.includes('calligraphy') ||
    t.includes('photography') ||
    c.includes('arts')
  ) {
    return imageDatabase.arts_crafts;
  }

  // Lifestyle & Cooking & Baking & Yoga & Gardening
  if (
    t.includes('cooking') ||
    t.includes('baking') ||
    t.includes('gardening') ||
    t.includes('yoga') ||
    t.includes('home repair') ||
    c.includes('lifestyle')
  ) {
    return imageDatabase.lifestyle_cooking;
  }

  // Fiction / Novels (The Alchemist, 1984, Gatsby, Hobbit, Pride and Prejudice, etc.)
  if (
    t.includes('alchemist') ||
    t.includes('great gatsby') ||
    t.includes('1984') ||
    t.includes('animal farm') ||
    t.includes('hobbit') ||
    t.includes('kite runner') ||
    t.includes('pride and prejudice') ||
    t.includes('catcher in the rye') ||
    t.includes('life of pi') ||
    t.includes('book thief') ||
    c.includes('fiction')
  ) {
    return imageDatabase.fiction_novel;
  }

  // Children's Books
  if (
    t.includes('caterpillar') ||
    t.includes('charlotte') ||
    t.includes('matilda') ||
    t.includes('chocolate factory') ||
    t.includes('jungle book') ||
    t.includes('little prince') ||
    t.includes('alice') ||
    t.includes('peter pan') ||
    t.includes('secret garden') ||
    t.includes('pooh') ||
    c.includes('children')
  ) {
    return imageDatabase.children_books;
  }

  // Biography & Autobiography
  if (
    t.includes('wings of fire') ||
    t.includes('steve jobs') ||
    t.includes('mandela') ||
    t.includes('anne frank') ||
    t.includes('experiments with truth') ||
    t.includes('einstein') ||
    t.includes('leonardo') ||
    c.includes('biography')
  ) {
    return imageDatabase.biography;
  }

  // History & Geography
  if (
    t.includes('history') ||
    t.includes('gandhi') ||
    t.includes('discovery of india') ||
    t.includes('geography') ||
    t.includes('atlas') ||
    t.includes('independence') ||
    c.includes('history') ||
    c.includes('geography')
  ) {
    return imageDatabase.history_geography;
  }

  // Business & Management
  if (
    t.includes('rich dad') ||
    t.includes('lean startup') ||
    t.includes('intelligent investor') ||
    t.includes('zero to one') ||
    t.includes('good to great') ||
    t.includes('blue ocean') ||
    t.includes('hard thing') ||
    c.includes('business') ||
    c.includes('management')
  ) {
    return imageDatabase.business_finance;
  }

  // Self-Development & Habits
  if (
    t.includes('atomic habits') ||
    t.includes('power of habit') ||
    t.includes('deep work') ||
    t.includes('essentialism') ||
    t.includes('power of now') ||
    t.includes('win friends') ||
    t.includes('can\'t hurt me') ||
    c.includes('self-development')
  ) {
    return imageDatabase.self_development;
  }

  // Science & Physics & Astronomy
  if (
    t.includes('cosmos') ||
    t.includes('brief history of time') ||
    t.includes('selfish gene') ||
    t.includes('origin of species') ||
    t.includes('astrophysics') ||
    t.includes('physics') ||
    t.includes('chemistry') ||
    c.includes('science')
  ) {
    return imageDatabase.science_physics;
  }

  // Languages & Literature
  if (
    t.includes('hamlet') ||
    t.includes('macbeth') ||
    t.includes('romeo') ||
    t.includes('odyssey') ||
    t.includes('iliad') ||
    t.includes('great expectations') ||
    c.includes('languages') ||
    c.includes('literature')
  ) {
    return imageDatabase.languages_literature;
  }

  // Academic & Study
  if (c.includes('education') || c.includes('academic') || t.includes('study')) {
    return imageDatabase.education_study;
  }

  // Default Fallback
  return imageDatabase.education_study;
};

const updateCovers = async () => {
  try {
    await connectDB();
    const books = await Book.find({});
    console.log(`Updating covers for ${books.length} books...`);

    let updatedCount = 0;
    for (const b of books) {
      const newCover = getMatchingImage(b.title, b.category);
      b.coverImage = newCover;
      await b.save();
      updatedCount++;
    }

    console.log(`✅ Successfully updated ${updatedCount} book covers with matching thematic images!`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ Error updating covers: ${err.message}`);
    process.exit(1);
  }
};

updateCovers();
