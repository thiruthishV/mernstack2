import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from './models/User.js';
import { Book } from './models/Book.js';
import { BorrowRecord } from './models/BorrowRecord.js';
import { Reservation } from './models/Reservation.js';
import { Notification } from './models/Notification.js';
import { connectDB } from './config/db.js';

dotenv.config();

const sampleBooks = [
  {
    title: 'Data Science with Python',
    author: 'Jake VanderPlas',
    isbn: '978-1491957660',
    category: 'Computer Science',
    description: 'Essential desk reference for computational and statistical methods in Python, including NumPy, Pandas, and Matplotlib.',
    coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600',
    totalCopies: 2,
    availableCopies: 0, // 0 copies available for testing Pre-Booking System!
    shelfLocation: 'Rack CS-01',
    publicationYear: 2022
  },
  {
    title: 'MERN Stack Front To Back',
    author: 'Brad Traversy',
    isbn: '978-0134685991',
    category: 'Web Development',
    description: 'Full stack development with MongoDB, Express, React, and Node.js with modern best practices.',
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=600',
    totalCopies: 2,
    availableCopies: 0, // 0 copies available for pre-booking queue test
    shelfLocation: 'Rack WEB-02',
    publicationYear: 2023
  },
  {
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    isbn: '978-0132350884',
    category: 'Computer Science',
    description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
    coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&q=80&w=600',
    totalCopies: 5,
    availableCopies: 4,
    shelfLocation: 'Rack CS-03',
    publicationYear: 2020
  },
  {
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    isbn: '978-1449373320',
    category: 'System Design',
    description: 'The big ideas behind reliable, scalable, and maintainable systems.',
    coverImage: 'https://images.unsplash.com/photo-1507842229451-7f01be7fe829?auto=format&fit=crop&q=80&w=600',
    totalCopies: 4,
    availableCopies: 2,
    shelfLocation: 'Rack SD-01',
    publicationYear: 2021
  },
  {
    title: 'The Pragmatic Programmer: Your Journey To Mastery',
    author: 'David Thomas & Andrew Hunt',
    isbn: '978-0135957059',
    category: 'Software Engineering',
    description: 'One of the most significant books on modern software engineering craft and architecture.',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
    totalCopies: 3,
    availableCopies: 2,
    shelfLocation: 'Rack SE-04',
    publicationYear: 2020
  },
  {
    title: 'Artificial Intelligence: A Modern Approach',
    author: 'Stuart Russell & Peter Norvig',
    isbn: '978-0136042594',
    category: 'Artificial Intelligence',
    description: 'The authoritative, most widely adopted standard text in artificial intelligence worldwide.',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600',
    totalCopies: 3,
    availableCopies: 1,
    shelfLocation: 'Rack AI-05',
    publicationYear: 2022
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    isbn: '978-0735211292',
    category: 'Self Development',
    description: 'An easy and proven way to build good habits and break bad ones.',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
    totalCopies: 6,
    availableCopies: 5,
    shelfLocation: 'Rack SD-08',
    publicationYear: 2021
  }
];

const seedData = async () => {
  try {
    await connectDB();

    console.log('Clearing existing records...');
    await User.deleteMany();
    await Book.deleteMany();
    await BorrowRecord.deleteMany();
    await Reservation.deleteMany();
    await Notification.deleteMany();

    console.log('Creating Admin and Members...');
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@library.com',
      password: 'admin123',
      role: 'admin',
      membershipId: 'ADM-1001',
      phone: '+91 98765 43210'
    });

    const member1 = await User.create({
      name: 'Praveen Kumar',
      email: 'user@library.com',
      password: 'user123',
      role: 'member',
      membershipId: 'LIB-2001',
      phone: '+91 98765 11111'
    });

    const member2 = await User.create({
      name: 'Ananya Sharma',
      email: 'student@library.com',
      password: 'student123',
      role: 'member',
      membershipId: 'LIB-2002',
      phone: '+91 98765 22222'
    });

    console.log('Seeding Books...');
    const createdBooks = await Book.insertMany(sampleBooks);

    // Create an active borrow for "Data Science with Python" borrowed by member2 (Ananya)
    // so availableCopies is 0, and member1 (Praveen) can Reserve it!
    const pythonBook = createdBooks.find(b => b.title === 'Data Science with Python');
    if (pythonBook) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 10);

      await BorrowRecord.create({
        user: member2._id,
        book: pythonBook._id,
        borrowDate: new Date(),
        dueDate,
        status: 'borrowed'
      });
    }

    console.log('✅ Library Database Seeded Successfully!');
    console.log('----------------------------------------------------');
    console.log('Demo Credentials:');
    console.log('👑 Admin:   admin@library.com   / admin123');
    console.log('👤 Member:  user@library.com    / user123');
    console.log('👤 Member:  student@library.com / student123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
