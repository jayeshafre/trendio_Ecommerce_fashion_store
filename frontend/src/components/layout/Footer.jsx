import { Link } from "react-router-dom";
import { FaFacebook, FaTwitter, FaYoutube, FaInstagram } from "react-icons/fa";
import { ShieldCheck, RotateCcw } from "lucide-react";

const SOCIAL_LINKS = [
  { icon: FaFacebook,  href: "https://facebook.com",  label: "Facebook"  },
  { icon: FaTwitter,   href: "https://twitter.com",   label: "Twitter"   },
  { icon: FaYoutube,   href: "https://youtube.com",   label: "YouTube"   },
  { icon: FaInstagram, href: "https://instagram.com", label: "Instagram" },
];

export default function Footer() {
  return (
    <footer
      className="w-full border-t"
      style={{ backgroundColor: "#F8F5F2", borderColor: "#E5DCD3" }}
    >

      {/* ================= MAIN GRID ================= */}
      <div className="mx-auto max-w-[1400px] px-6 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Column 1 */}
          <div>
            <h3 className="mb-4 text-xs font-bold tracking-widest">ONLINE SHOPPING</h3>
            <ul className="space-y-2 text-sm text-[#7A6E67]">
              <li><Link to="/shop?category=shirts">Shirts</Link></li>
              <li><Link to="/shop?category=jeans">Jeans</Link></li>
              <li><Link to="/shop?category=t-shirts">T-Shirts</Link></li>
              <li><Link to="/shop?category=trousers">Trousers</Link></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="mb-4 text-xs font-bold tracking-widest">CUSTOMER POLICIES</h3>
            <ul className="space-y-2 text-sm text-[#7A6E67]">
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/terms">Terms</Link></li>
              <li><Link to="/privacy">Privacy</Link></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h3 className="mb-4 text-xs font-bold tracking-widest">KEEP IN TOUCH</h3>
            <div className="flex gap-4">
              {SOCIAL_LINKS.map(({ icon: Icon, href }) => (
                <a key={href} href={href} target="_blank" rel="noreferrer">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Column 4 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} />
              <p className="text-sm">100% ORIGINAL</p>
            </div>
            <div className="flex items-center gap-3">
              <RotateCcw size={20} />
              <p className="text-sm">7 Days Return</p>
            </div>
          </div>

        </div>
      </div>

      {/* ================= BOTTOM SECTION ================= */}
      <div className="border-t" style={{ borderColor: "#E5DCD3" }}>
        <div className="w-full px-6 py-6">

          {/* Row 1: Full width spacing */}
          <div className="flex w-full items-center justify-between">

            {/* Left */}
            <Link
              to="/"
              className="text-xl italic"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Trendio
            </Link>

            {/* Center */}
            <p className="text-sm text-[#7A6E67] text-center">
              © {new Date().getFullYear()} Trendio. All rights reserved.
            </p>

            {/* Right */}
            <div className="flex gap-3">
              {["Visa", "Mastercard", "UPI", "Razorpay"].map((m) => (
                <span key={m} className="border px-3 py-1 text-xs rounded">
                  {m}
                </span>
              ))}
            </div>

          </div>

          {/* Row 2: Your Name */}
          <div className="mt-4 text-center border-t pt-4">
            <p className="text-xl font-bold">
              Designed & Developed by{" "}
              <span className="text-[#C2A98A]">Jayesh Afre</span>
            </p>
          </div>

          {/* Row 3: Address BELOW NAME */}
          {/* Row 3: Address (LEFT) + Contact (RIGHT) */}
<div className="mt-6 border-t pt-6">
  <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">

    {/* LEFT: Address */}
    <div className="text-sm leading-relaxed" style={{ color: "#7A6E67" }}>
      <h3
        className="mb-2 text-sm font-bold"
        style={{ color: "#2B2B2B" }}
      >
        Visit Our Shop
      </h3>

      <p>Indira Gandhi Chaowk,</p>
      <p>Dusane Complex, Behind Sonue Dusane Jwellers</p>
      <p>District: Jalgaon, Tal: Raver</p>
      <p>Savda – 425502, India</p>
    </div>

    {/* RIGHT: Contact */}
    <div className="text-sm" style={{ color: "#7A6E67" }}>
      <p>
        Telephone:{" "}
        <span style={{ color: "#2B2B2B", fontWeight: "600" }}>
          7020691402
        </span>
      </p>
    </div>

  </div>
</div>

        </div>
      </div>

    </footer>
  );
}