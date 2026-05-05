import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { aiApi } from "@api";
import { formatCurrency } from "@utils";

/* ───────────────── Product Card ───────────────── */
function ProductCard({ product }) {
  const price = product.sale_price || product.base_price;

  const imageUrl = product.primary_image
    ? `http://localhost:8000/media/${product.primary_image.replace(/\\/g, "/")}`
    : null;

  return (
    <Link
      to={`/product/${product.slug}`}
      className="flex items-center gap-3 rounded-xl p-2 mt-2 transition-colors hover:bg-[#EDE3D9]"
      style={{ border: "1px solid #E5DCD3", backgroundColor: "#fff" }}
    >
      {/* Image */}
      <div
        className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg"
        style={{ backgroundColor: "#EDE3D9" }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[#EDE3D9]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-medium leading-snug line-clamp-2"
          style={{ color: "#2B2B2B" }}
        >
          {product.title}
        </p>
        <p
          className="text-xs font-semibold mt-0.5"
          style={{ color: "#C2A98A" }}
        >
          {formatCurrency(price)}
        </p>
      </div>

      <span className="text-xs flex-shrink-0" style={{ color: "#C2A98A" }}>
        →
      </span>
    </Link>
  );
}

/* ───────────────── Message Bubble ───────────────── */
function Message({ msg }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div className="max-w-[85%]">
        <div
          className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
          style={{
            backgroundColor: isUser ? "#C2A98A" : "#EDE3D9",
            color: isUser ? "#fff" : "#2B2B2B",
            borderBottomRightRadius: isUser ? 4 : undefined,
            borderBottomLeftRadius: isUser ? undefined : 4,
          }}
        >
          {msg.content}
        </div>

        {/* Products */}
        {!isUser && msg.products?.length > 0 && (
          <div className="mt-1">
            {msg.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────── Chat Widget ───────────────── */
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Tooltip state (ADDED)
  const [showTooltip, setShowTooltip] = useState(true);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your Trendio style assistant. Ask me anything — outfit ideas, product suggestions, or style advice.",
      products: [],
    },
  ]);

  const bottomRef = useRef(null);

  /* Auto scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ✅ Auto-hide tooltip after 5s */
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  /* Send message */
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, products: [] },
    ]);

    setInput("");
    setLoading(true);

    try {
      const res = await aiApi.chat(text);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.data.answer,
          products: res.data.products_used || [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          products: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Window */}
      {open && (
        <div
          className="fixed bottom-24 right-4 z-50 flex flex-col rounded-2xl shadow-xl overflow-hidden"
          style={{
            width: "360px",
            height: "540px",
            backgroundColor: "#F8F5F2",
            border: "1px solid #E5DCD3",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "#E5DCD3", backgroundColor: "#fff" }}
          >
            <div>
              <p className="text-sm font-bold">Trendio Style Assistant</p>
              <p className="text-[10px]" style={{ color: "#7A6E67" }}>
                Powered by AI
              </p>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1 hover:bg-[#EDE3D9]"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} />
            ))}

            {loading && (
              <Loader2 size={14} className="animate-spin" />
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3 flex gap-2 bg-white">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything..."
              className="flex-1 rounded-xl border px-3 py-2 text-sm"
            />

            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="h-9 w-9 rounded-xl bg-[#C2A98A] flex items-center justify-center"
            >
              <Send size={14} color="#fff" />
            </button>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {!open && showTooltip && (
        <div className="fixed bottom-24 right-4 z-50 bg-[#2B2B2B] text-white px-4 py-3 rounded-2xl shadow-lg">
          👋 Need styling help?
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => {
          setOpen((o) => !o);
          setShowTooltip(false);
        }}
        className="fixed bottom-6 right-4 h-14 w-14 rounded-full bg-[#2B2B2B] flex items-center justify-center shadow-lg"
      >
        {open ? <X color="#fff" /> : <MessageCircle color="#fff" />}
      </button>
    </>
  );
}