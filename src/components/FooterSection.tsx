import { Bike, Clock, ExternalLink, MapPin, Phone, ShoppingBag, Utensils } from 'lucide-react';
import { RESTAURANT_LOCATION } from '../data/multanAreas.ts';

export function FooterSection() {
  return (
    <footer
      id="location-hours"
      className="mt-8 border-t border-red-200/80 dark:border-red-950/80 bg-[#fbe8e8]/70 dark:bg-[#120406]/70 backdrop-blur-md transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Summary */}
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/Sultan_Biryani_and_Grill_3fdb02a0.png"
                alt="Sultan Biryani and Grill"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-red-700/30"
              />
              <div>
                <h3 className="font-display font-extrabold text-lg text-[#220709] dark:text-white">
                  Sultan Biryani &amp; Grill
                </h3>
                <p className="text-xs text-[#6f373b] dark:text-red-200/75">
                  Model Town Market · Multan
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs sm:text-sm text-[#5c2529] dark:text-red-100/80 leading-relaxed max-w-sm">
              Fresh saffron dum biryani, live charcoal BBQ, crispy wraps, and family platters crafted daily in the heart of Multan.
            </p>
          </div>

          {/* Dining, Takeaway, Delivery */}
          <div>
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-red-800 dark:text-amber-300 mb-3">
              Services &amp; Hours
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-[#49191c] dark:text-red-100/85">
              <li className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0" />
                <span>Family &amp; Casual Dine-In Seating</span>
              </li>
              <li className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0" />
                <span>Express Counter Takeaway</span>
              </li>
              <li className="flex items-center gap-2">
                <Bike className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0" />
                <span>Multan-Wide Home Delivery (COD)</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0" />
                <span>Open Daily: 11:00 AM – 1:00 AM</span>
              </li>
            </ul>
          </div>

          {/* Address & Contact */}
          <div>
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-red-800 dark:text-amber-300 mb-3">
              Visit &amp; Direct Order
            </h4>
            <div className="space-y-2.5 text-xs sm:text-sm text-[#49191c] dark:text-red-100/85">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0 mt-0.5" />
                <span>{RESTAURANT_LOCATION.address}</span>
              </p>
              <a
                href={`tel:${RESTAURANT_LOCATION.phone}`}
                className="flex items-center gap-2 font-bold text-red-800 dark:text-amber-300 hover:underline"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span>Call / WhatsApp: 0328-6422227</span>
              </a>
              <a
                href={RESTAURANT_LOCATION.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-300 hover:underline"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-red-200/80 dark:border-red-950/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6f3a3d] dark:text-red-200/60">
          <p>© {new Date().getFullYear()} Sultan Biryani and Grill, Multan. All rights reserved.</p>
          <p>22-B, Model Town Market · Multan 66000</p>
        </div>
      </div>
    </footer>
  );
}
