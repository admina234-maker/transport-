import React, { useState } from "react";
import { Sparkles, X, Send, Bot, User, Phone, MessageSquare, Bus } from "lucide-react";
import { SCHOOL_INFO } from "../data/mockData";

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  time: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "ai",
      text: `Namaste! I am the Wisdom School Transport AI Assistant for Wisdom Nursery & Primary School, Essur. How can I help you regarding van routes, student tracking, fees, or contacting Chief Officer Mr. R SARAVANAN (9176593129)?`,
      time: "Just now",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      sender: "user",
      text: inputQuery.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/gemini/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMsg.text,
          context: { schoolName: SCHOOL_INFO.name, contact: "Mr. R SARAVANAN (9176593129)" },
        }),
      });

      const data = await res.json();
      const aiReplyText = data.text || "Thank you for reaching out to Wisdom Nursery and Primary School. For immediate help, please call Mr. R SARAVANAN at 9176593129.";

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: aiReplyText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `For transport or fee queries regarding Wisdom Nursery and Primary School, Essur, please call Mr. R SARAVANAN directly at 9176593129.`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 text-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-800 overflow-hidden flex flex-col h-[560px]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-400 text-slate-950 rounded-xl font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Wisdom AI Transport Helpdesk</h3>
              <p className="text-xs text-yellow-300">Wisdom Nursery & Primary School, Essur</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs sm:text-sm">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${m.sender === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`p-2 rounded-xl flex-shrink-0 ${
                  m.sender === "user" ? "bg-blue-600 text-white" : "bg-yellow-400 text-slate-950"
                }`}
              >
                {m.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] p-3 rounded-2xl leading-relaxed ${
                  m.sender === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700"
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>
                <span className="text-[10px] opacity-60 block mt-1 text-right">{m.time}</span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-yellow-400 font-bold p-2 bg-slate-800/50 rounded-xl w-max">
              <Sparkles className="w-4 h-4 animate-spin" />
              Wisdom AI is generating response...
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex gap-2 overflow-x-auto text-[11px] whitespace-nowrap">
          <button
            onClick={() => setInputQuery("What is the transport fee structure?")}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700"
          >
            💰 Fee Structure
          </button>
          <button
            onClick={() => setInputQuery("How do I contact Mr. R SARAVANAN?")}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700"
          >
            📞 Contact Mr. R Saravanan
          </button>
          <button
            onClick={() => setInputQuery("How do I pay fees via UPI QR?")}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700"
          >
            📲 UPI Payment Info
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask a question about transport, fees, or route safety..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="flex-1 bg-slate-900 text-white text-xs sm:text-sm border border-slate-800 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold p-2.5 rounded-xl transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
