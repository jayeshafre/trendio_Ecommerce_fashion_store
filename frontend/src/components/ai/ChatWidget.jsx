import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { aiApi } from "@api";

function Message({ msg }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
        style={{
          backgroundColor: isUser ? "#C2A98A" : "#EDE3D9",
          color:           isUser ? "#fff"    : "#2B2B2B",
          borderBottomRightRadius: isUser ? 4 : undefined,
          borderBottomLeftRadius:  isUser ? undefined : 4,
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your Trendio style assistant. Ask me anything — outfit ideas, product suggestions, or style advice.",
    },
  ]);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await aiApi.chat(text);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.answer },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
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
      {/* Chat drawer */}
      {open && (
        <div
          className="fixed bottom-24 right-4 z-50 flex flex-col rounded-2xl shadow-xl overflow-hidden"
          style={{
            width:           "360px",
            height:          "520px",
            backgroundColor: "#F8F5F2",
            border:          "1px solid #E5DCD3",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "#E5DCD3", backgroundColor: "#fff" }}>
            <div>
              <p className="text-sm font-bold" style={{ color: "#2B2B2B" }}>
                Trendio Style Assistant
              </p>
              <p className="text-[10px]" style={{ color: "#7A6E67" }}>
                Powered by AI
              </p>
            </div>
            <button onClick={() => setOpen(false)}
              className="rounded-full p-1 hover:bg-[#EDE3D9] transition-colors">
              <X size={16} style={{ color: "#7A6E67" }} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} />
            ))}
            {loading && (
              <div className="flex justify-start mb-3">
                <div className="rounded-2xl rounded-bl-sm px-4 py-2.5"
                  style={{ backgroundColor: "#EDE3D9" }}>
                  <Loader2 size={14} className="animate-spin" style={{ color: "#C2A98A" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3 flex gap-2"
            style={{ borderColor: "#E5DCD3", backgroundColor: "#fff" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything..."
              className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:border-[#C2A98A]"
              style={{
                borderColor:     "#E5DCD3",
                backgroundColor: "#F8F5F2",
                color:           "#2B2B2B",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors disabled:opacity-40"
              style={{ backgroundColor: "#C2A98A" }}
            >
              <Send size={14} style={{ color: "#fff" }} />
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
        style={{ backgroundColor: "#2B2B2B" }}
      >
        {open
          ? <X size={20} style={{ color: "#fff" }} />
          : <MessageCircle size={20} style={{ color: "#fff" }} />
        }
      </button>
    </>
  );
}