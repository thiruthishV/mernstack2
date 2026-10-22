import React from 'react';
import { BookOpen, Shield, Clock, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-slate-900">Librio</span>
            </div>
            <p className="text-sm text-slate-500 max-w-sm">
              Smart Library Management System featuring automated Pre-Booking Queue System. Never miss your favorite title with automated copy allocation and overdue management.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-teal-600" /> 14-Day Lending
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-indigo-600" /> FIFO Queue System
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/books" className="hover:text-teal-600 transition-colors">
                  All Books
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-teal-600 transition-colors">
                  My Reservations
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-teal-600 transition-colors">
                  Member Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Demo Credentials Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <h5 className="font-bold text-slate-800">Quick Demo Credentials</h5>
            <p className="text-slate-600">
              <strong className="text-indigo-600">Admin:</strong> admin@library.com / admin123
            </p>
            <p className="text-slate-600">
              <strong className="text-teal-600">Member:</strong> user@library.com / user123
            </p>
            <p className="text-[11px] text-slate-400 pt-1">
              Pre-seeded with out-of-stock books to test the Pre-Booking Queue!
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <p>© {new Date().getFullYear()} Librio Management System. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with React, Express, MongoDB & Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
