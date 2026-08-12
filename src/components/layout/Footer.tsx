import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-slate-950 text-slate-300 py-12 px-4 sm:px-6 border-t border-slate-900 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
        <div className="flex flex-col gap-4 md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="font-heading font-black text-xl text-white uppercase tracking-tight">NAMMA THANJAI<span className="text-yellow-500">.</span></span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
            The premier local community directory connecting buyers, sellers, services, and shops directly across Thanjavur.
          </p>
        </div>
        
        <div className="flex flex-col gap-3">
          <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-2">Explore</h4>
          <Link href="/sell" className="text-sm hover:text-yellow-400 transition-colors">Buy & Sell</Link>
          <Link href="/services" className="text-sm hover:text-yellow-400 transition-colors">Services</Link>
          <Link href="/shops" className="text-sm hover:text-yellow-400 transition-colors">Local Shops</Link>
          <Link href="/need" className="text-sm hover:text-yellow-400 transition-colors">Needs Directory</Link>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-2">Community</h4>
          <Link href="/?auth=popup" className="text-sm hover:text-yellow-400 transition-colors">Register to Post Ad</Link>
          <a href="#" className="text-sm hover:text-yellow-400 transition-colors">Help & Support</a>
          <a href="#" className="text-sm hover:text-yellow-400 transition-colors">Contact Us</a>
        </div>
      </div>
      
      <div className="w-full max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-800/50 text-xs text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>© {new Date().getFullYear()} Namma Thanjai. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
