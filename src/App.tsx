/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Search, Globe, Clock, ArrowRight, Sparkles, X, Menu, ExternalLink, ChevronRight, Home, ArrowLeft, RefreshCw, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { LoginWithSanscounts } from './components/LoginWithSanscounts';

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface SearchResult {
  title: string;
  uri: string;
  snippet?: string;
  imageUrl?: string;
}

interface ImageResult {
  title: string;
  imageUrl: string;
  link: string;
}

const KnowledgePanelComponent = ({ panel, onAttributeClick }: { panel: any, onAttributeClick: (q: string) => void }) => {
  if (!panel || !panel.title) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
    >
      {(panel.imageUrl || panel.image) && (
        <div className="w-full aspect-square overflow-hidden bg-neutral-900">
          <img 
            src={panel.imageUrl || panel.image} 
            alt={panel.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-1">
          {panel.title}
          {panel.isAiGenerated && (
            <Sparkles size={16} className="inline-block ml-2 text-blue-400" />
          )}
        </h2>
        {panel.type && (
          <p className="text-sm text-neutral-500 mb-4">{panel.type}</p>
        )}
        
        {panel.description && (
          <p className="text-sm text-neutral-300 leading-relaxed mb-6">
            {panel.description}
            {panel.descriptionLink && (
              <a 
                href={panel.descriptionLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline ml-1"
              >
                Wikipedia
              </a>
            )}
          </p>
        )}

        {panel.attributes && Object.keys(panel.attributes).length > 0 && (
          <div className="space-y-4 border-t border-white/5 pt-6">
            {Object.entries(panel.attributes).map(([key, value]: [string, any]) => (
              <div key={key} className="text-sm">
                <span className="font-semibold text-neutral-400 mr-2">{key}:</span>
                <button 
                  onClick={() => onAttributeClick(String(value))}
                  className="text-blue-400 hover:underline text-left"
                >
                  {String(value)}
                </button>
              </div>
            ))}
          </div>
        )}

        {panel.website && (
          <a 
            href={panel.website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-all"
          >
            Official Website
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </motion.div>
  );
};

interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [images, setImages] = useState<ImageResult[]>([]);
  const [knowledgePanel, setKnowledgePanel] = useState<any>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isGeneratingKg, setIsGeneratingKg] = useState(false);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const transformUrl = (url: string) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com') && u.pathname === '/watch') {
        const v = u.searchParams.get('v');
        if (v) return `https://www.youtube.com/embed/${v}`;
      }
      if (u.hostname.includes('youtu.be')) {
        const v = u.pathname.slice(1);
        if (v) return `https://www.youtube.com/embed/${v}`;
      }
    } catch (e) {}
    return url;
  };

  const handleReadWithAI = async (url: string) => {
    setIsReading(true);
    setAnswer(null);
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Please visit this URL: ${url} and provide a comprehensive, well-formatted summary of its content. Include key points, main arguments, and any important details so I don't have to visit the site directly. Format with clear headings and bullet points.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      setAnswer(response.text);
    } catch (err) {
      setError("AI couldn't read this site. Please try opening it in a new tab.");
    } finally {
      setIsReading(false);
    }
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem('san_sloud_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveToHistory = (q: string) => {
    const newHistory = [
      { query: q, timestamp: Date.now() },
      ...history.filter(h => h.query !== q).slice(0, 9)
    ];
    setHistory(newHistory);
    localStorage.setItem('san_sloud_history', JSON.stringify(newHistory));
  };

  const handleSearch = async (e?: React.FormEvent, forcedQuery?: string) => {
    if (e) e.preventDefault();
    const activeQuery = forcedQuery || query;
    if (!activeQuery.trim()) return;

    const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/.*)?$/i;
    if (urlPattern.test(activeQuery) && !activeQuery.includes(' ')) {
      let finalUrl = activeQuery;
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl;
      }
      setActiveUrl(finalUrl);
      setQuery(finalUrl);
      setShowHistory(false);
      return;
    }

    setIsSearching(true);
    setIsGeneratingKg(true);
    setError(null);
    setAnswer(null);
    setResults([]);
    setImages([]);
    setKnowledgePanel(null);
    setActiveUrl(null);
    saveToHistory(activeQuery);
    setShowHistory(false);

    let currentKg: any = null;

    // Filter for gambling/casino sites
    const isGamblingSite = (text: string) => {
      const gamblingKeywords = ['casino', 'gambling', 'betting', 'juy', 'poker', 'slot', 'jackpot', 'lottery', '1xbet', 'melbet', 'bet365', 'betway', 'parimatch'];
      return gamblingKeywords.some(keyword => text.toLowerCase().includes(keyword));
    };

    // Special Case: Siam The Bin
    if (activeQuery.toLowerCase().includes('siam the bin')) {
      currentKg = {
        title: "Siam The Bin",
        type: "Content Creator & Influencer",
        description: "Siam The Bin is a popular Bangladeshi content creator and social media influencer known for his unique style and engaging content. He has built a significant following across various platforms, sharing insights and entertainment with his audience.",
        imageUrl: "https://picsum.photos/seed/siam/800/800",
        attributes: {
          "Occupation": "Content Creator",
          "Nationality": "Bangladeshi",
          "Known for": "Social Media Content",
          "Platform": "YouTube & Facebook"
        },
        isAiGenerated: false
      };
      setKnowledgePanel(currentKg);
    }

    try {
      const serperKey = import.meta.env.VITE_SERPER_API_KEY;
      let serperSuccess = false;

      if (serperKey) {
        try {
          // Fetch Organic Results
          const organicPromise = fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': serperKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ q: activeQuery })
          }).then(async res => {
            if (!res.ok) {
              const errorText = await res.text();
              throw new Error(`Serper Organic Error: ${res.status} ${errorText}`);
            }
            return res.json();
          });

          // Fetch Image Results
          const imagesPromise = fetch('https://google.serper.dev/images', {
            method: 'POST',
            headers: {
              'X-API-KEY': serperKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ q: activeQuery, num: 20 })
          }).then(async res => {
            if (!res.ok) {
              const errorText = await res.text();
              throw new Error(`Serper Images Error: ${res.status} ${errorText}`);
            }
            return res.json();
          });

          const [data, imageData] = await Promise.all([organicPromise, imagesPromise]);
          
          if (data.organic && data.organic.length > 0) {
            const filteredResults = data.organic
              .filter((item: any) => !isGamblingSite(item.title) && !isGamblingSite(item.snippet || '') && !isGamblingSite(item.link))
              .map((item: any) => ({
                title: item.title,
                uri: item.link,
                snippet: item.snippet,
                imageUrl: item.imageUrl
              }));
            setResults(filteredResults);
          }

          if (imageData.images && imageData.images.length > 0) {
            const filteredImages = imageData.images
              .filter((img: any) => !isGamblingSite(img.title) && !isGamblingSite(img.link))
              .map((img: any) => ({
                title: img.title,
                imageUrl: img.imageUrl,
                link: img.link
              }));
            setImages(filteredImages);
          }
          
          if (data.answerBox) {
            setAnswer(data.answerBox.snippet || data.answerBox.answer || null);
          } 
          
          if (data.knowledgeGraph && !currentKg) {
            currentKg = data.knowledgeGraph;
            if (!currentKg.imageUrl && imageData.images && imageData.images[0]) {
              currentKg.imageUrl = imageData.images[0].imageUrl;
            }
            setKnowledgePanel(currentKg);
          }
          serperSuccess = true;
        } catch (serperErr) {
          console.error("Serper API failed, falling back to Gemini:", serperErr);
          // Continue to Gemini fallback below
        }
      }

      if (!serperSuccess) {
        // Fallback to Gemini with Streaming for faster perceived performance
        const responseStream = await genAI.models.generateContentStream({
          model: "gemini-3-flash-preview",
          contents: activeQuery,
          config: {
            systemInstruction: "You are San Sloud, a highly precise and accurate general search engine. You MUST use the googleSearch tool to find EXACT, real-world information, websites, and factual data for the user's query. If the user searches for a website like 'YouTube' or 'Facebook', provide the direct link and a brief description. Do not hallucinate. Format your response beautifully using markdown.",
            tools: [{ googleSearch: {} }],
          },
        });

        let fullText = '';
        let foundResults = false;
        
        for await (const chunk of responseStream) {
          if (chunk.text) {
            fullText += chunk.text;
            setAnswer(fullText);
          }
          
          if (!foundResults) {
            const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (chunks) {
              const extractedResults = chunks
                .filter((c: any) => c.web)
                .map((c: any) => ({
                  title: c.web?.title || 'Untitled',
                  uri: c.web?.uri || '',
                }));
              if (extractedResults.length > 0) {
                setResults(extractedResults);
                foundResults = true;
              }
            }
          }
        }
        if (!fullText) setAnswer("No direct answer found.");
      }

      // AI Knowledge Panel Fallback (Run if no KG found so far)
      if (!currentKg) {
        try {
          const aiPanelResponse = await genAI.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Create a structured knowledge panel for the query: "${activeQuery}". 
            Provide a comprehensive, factual, and professional summary of this topic.
            Return a JSON object with exactly these fields:
            - title: The name or topic
            - type: Category or brief label (e.g., "Person", "City", "Technology")
            - description: A detailed 2-3 paragraph professional summary
            - imageUrl: A direct public URL to a high-quality image related to this topic. Use a reliable source like Wikipedia or a high-quality placeholder if unknown.
            - attributes: A small object with 4-6 key facts as key-value pairs.
            
            Return ONLY the raw JSON object. Do not include markdown formatting or backticks.`,
            config: {
              responseMimeType: "application/json",
              tools: [{ googleSearch: {} }]
            }
          });
          
          if (aiPanelResponse.text) {
            try {
              // Robust JSON extraction
              let jsonStr = aiPanelResponse.text.trim();
              const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                jsonStr = jsonMatch[0];
              }
              
              const aiPanelData = JSON.parse(jsonStr);
              if (aiPanelData && aiPanelData.title) {
                // If AI didn't provide an image, try to use one from search results
                if (!aiPanelData.imageUrl && images.length > 0) {
                  aiPanelData.imageUrl = images[0].imageUrl;
                }
                
                setKnowledgePanel({
                  ...aiPanelData,
                  isAiGenerated: true
                });
              }
            } catch (parseError) {
              console.error("JSON Parse Error for AI Panel:", parseError, aiPanelResponse.text);
            }
          }
        } catch (e) {
          console.log("AI Panel generation failed", e);
        } finally {
          setIsGeneratingKg(false);
        }
      } else {
        setIsGeneratingKg(false);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to fetch results. Please check your connection or API key.");
    } finally {
      setIsSearching(false);
      setIsGeneratingKg(false); // Safety net
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('san_sloud_history');
  };

  // Quick Apps Data
  return (
    <div className="min-h-screen bg-black flex flex-col items-center text-neutral-200 font-sans">
      {/* Internal Browser Overlay */}
      <AnimatePresence>
        {activeUrl && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 z-[200] bg-black flex flex-col"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0A0A0A]">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveUrl(null)}
                  className="p-2 hover:bg-white/5 rounded-full text-neutral-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex flex-col">
                  <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Viewing Source</span>
                  <span className="text-sm text-white font-medium truncate max-w-[200px] md:max-w-md">{activeUrl}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.open(activeUrl, '_blank')}
                  className="p-2 hover:bg-white/5 rounded-full text-neutral-400 hover:text-white transition-colors"
                  title="Open in Browser"
                >
                  <ExternalLink size={18} />
                </button>
                <button 
                  onClick={() => setActiveUrl(null)}
                  className="p-2 hover:bg-white/5 rounded-full text-neutral-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-white">
              <iframe 
                src={transformUrl(activeUrl)} 
                className="w-full h-full border-none"
                title="Internal Browser"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation / Header */}
      <header className="w-full px-6 py-4 flex justify-between items-center z-50 border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => {
          setResults([]);
          setImages([]);
          setAnswer(null);
          setQuery('');
          setKnowledgePanel(null);
          setActiveUrl(null);
          setError(null);
        }}>
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black font-bold text-lg shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] transition-all relative">
            S
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black animate-pulse"></div>
          </div>
          <span className="font-sans font-semibold text-xl tracking-tight text-white group-hover:text-blue-400 transition-colors">San Sloud</span>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("App URL copied! Use this link in your phone's browser.");
            }}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-medium text-neutral-400 hover:text-white transition-all"
          >
            <ExternalLink size={12} />
            Copy App URL
          </button>
          <div className="lg:hidden px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] text-blue-400 font-bold uppercase tracking-tighter">
            Mobile Active
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">Build v1.3.5</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-tighter">Live Sync</span>
              </div>
            </div>
            <button 
              onClick={() => {
                // Aggressive cache clearing and reload
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('v', Date.now().toString());
                window.location.href = newUrl.toString();
              }}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-neutral-500 hover:text-white transition-all group"
              title="Force Update & Clear Cache"
            >
              <RotateCcw size={18} className="group-active:rotate-180 transition-transform duration-500" />
            </button>
          </div>
          {user ? (
            <div className="flex items-center gap-3 bg-[#0A0A0A] border border-white/10 px-3 py-1.5 rounded-full">
              <img src={user.avatar || "https://i.postimg.cc/wvXS9k1D/IMG-9128.jpg"} alt="Avatar" className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
              <span className="text-sm font-medium text-white">{user.name || 'User'}</span>
              <button onClick={() => setUser(null)} className="text-xs text-neutral-500 hover:text-white transition-colors ml-2">Logout</button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-1.5 bg-white text-black text-sm font-medium rounded-md hover:bg-neutral-200 transition-all"
            >
              Sign in
            </button>
          )}
          <button className="p-1.5 text-neutral-500 hover:text-white transition-colors">
            <Menu size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl px-6 pt-24 pb-32 flex flex-col items-center">
        {/* Hero Section */}
        <AnimatePresence mode="wait">
          {!results.length && !answer && !isSearching ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center mb-12"
            >
              <h1 className="font-sans font-bold text-5xl md:text-7xl mb-6 tracking-tighter text-white">
                Search the Web.
              </h1>
              <p className="text-neutral-400 text-lg max-w-md mx-auto">
                San Sloud Search. Get exact results, direct links, and AI-powered insights instantly.
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Search Bar Container */}
        <div className={`w-full transition-all duration-500 ${results.length || answer || isSearching ? 'mt-0' : 'mt-0'}`}>
          <form onSubmit={handleSearch} className="relative group">
            <div className="relative flex items-center bg-[#0A0A0A] rounded-xl border border-neutral-800 overflow-hidden shadow-sm focus-within:border-neutral-500 transition-all">
              <div className="pl-5 text-neutral-500">
                <Search size={20} className="group-focus-within:text-white transition-colors" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowHistory(true)}
                placeholder="Search anything..."
                className="w-full py-4 px-4 text-lg bg-transparent border-none focus:ring-0 outline-none text-white placeholder-neutral-600 font-sans"
              />
              <div className="flex items-center gap-2 pr-2">
                <button
                  type="submit"
                  disabled={isSearching || !query.trim()}
                  className="p-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <Globe size={18} />
                    </motion.div>
                  ) : (
                    <ArrowRight size={18} />
                  )}
                </button>
              </div>
            </div>

            {isGeneratingKg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -bottom-6 left-0 right-0 flex justify-center"
              >
                <span className="text-[10px] text-blue-400 font-medium flex items-center gap-1">
                  <Sparkles size={10} className="animate-pulse" />
                  AI is generating a knowledge summary...
                </span>
              </motion.div>
            )}

            {/* History Dropdown */}
            <AnimatePresence>
              {showHistory && history.length > 0 && !isSearching && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] rounded-xl border border-neutral-800 overflow-hidden z-[60] shadow-2xl"
                >
                  <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-black/50">
                    <span className="text-xs font-medium text-neutral-500 flex items-center gap-2">
                      <Clock size={14} /> Recent Searches
                    </span>
                    <button
                      type="button"
                      onClick={clearHistory}
                      className="text-xs text-neutral-500 hover:text-white transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {history.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setQuery(item.query);
                          handleSearch(undefined, item.query);
                        }}
                        className="w-full px-5 py-3 text-left hover:bg-neutral-900 flex items-center justify-between group transition-colors"
                      >
                        <span className="text-neutral-300 group-hover:text-white transition-colors">{item.query}</span>
                        <ChevronRight size={16} className="text-neutral-600 group-hover:text-white transition-colors" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
          {showHistory && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowHistory(false)}
            ></div>
          )}
        </div>

        {/* Content Section */}
        <div className="w-full mt-16">
          {isSearching && (
            <div className="space-y-6 w-full max-w-2xl mx-auto">
              <div className="h-3 bg-neutral-900 rounded-full w-full animate-pulse"></div>
              <div className="h-3 bg-neutral-900 rounded-full w-5/6 animate-pulse"></div>
              <div className="h-3 bg-neutral-900 rounded-full w-4/6 animate-pulse"></div>
            </div>
          )}

          {error && (
            <div className="p-6 bg-red-950/20 border border-red-900/30 rounded-3xl text-red-400 flex items-center gap-4 max-w-2xl mx-auto">
              <X size={24} />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
          {/* Mobile Knowledge Panel (Top) */}
          {(knowledgePanel || isGeneratingKg) && (
            <div className="block lg:hidden w-full mb-10 p-4 bg-white/5 rounded-3xl border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-blue-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">AI Knowledge Summary</span>
                </div>
              </div>
              {isGeneratingKg ? (
                  <div className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 animate-pulse">
                    <div className="h-48 bg-neutral-900 rounded-xl mb-4"></div>
                    <div className="h-6 bg-neutral-900 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-neutral-900 rounded w-1/2 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-neutral-900 rounded w-full"></div>
                      <div className="h-3 bg-neutral-900 rounded w-full"></div>
                      <div className="h-3 bg-neutral-900 rounded w-2/3"></div>
                    </div>
                  </div>
                ) : (
                  <KnowledgePanelComponent 
                    panel={knowledgePanel} 
                    onAttributeClick={(q) => {
                      setQuery(q);
                      handleSearch(undefined, q);
                    }}
                  />
                )}
              </div>
            )}

            <div className="flex-1 w-full space-y-8">
              {(answer || isReading) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="vercel-card p-6 md:p-8 rounded-xl w-full"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-white">
                      <Sparkles size={18} className="text-blue-400" />
                      <span className="text-sm font-medium">{isReading ? 'AI is reading the page...' : 'AI Reader Mode'}</span>
                    </div>
                    {!isReading && (
                      <button onClick={() => setAnswer(null)} className="text-neutral-500 hover:text-white transition-colors">
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  {isReading ? (
                    <div className="space-y-4">
                      <div className="h-3 bg-neutral-900 rounded-full w-full animate-pulse"></div>
                      <div className="h-3 bg-neutral-900 rounded-full w-5/6 animate-pulse"></div>
                      <div className="h-3 bg-neutral-900 rounded-full w-4/6 animate-pulse"></div>
                    </div>
                  ) : (
                    <div className="markdown-body text-base">
                      <Markdown>{answer}</Markdown>
                    </div>
                  )}
                </motion.div>
              )}

              {images.length > 0 && (
                <div className="w-full">
                  <div className="flex items-center gap-2 text-neutral-500 mb-4 px-1">
                    <Sparkles size={16} className="text-yellow-500" />
                    <span className="text-sm font-medium">Images</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="group cursor-pointer"
                        onClick={() => setActiveUrl(img.link)}
                      >
                        <div className="aspect-square rounded-xl overflow-hidden bg-neutral-900 border border-white/5 mb-1">
                          <img 
                            src={img.imageUrl} 
                            alt={img.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <p className="text-[10px] text-neutral-400 line-clamp-1 px-1">{img.title}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {results.length > 0 && (
                <div className="w-full">
                  <div className="flex items-center gap-2 text-neutral-500 mb-4 px-1">
                    <Globe size={16} />
                    <span className="text-sm font-medium">Web Sources</span>
                  </div>
                  <div className="grid gap-3">
                    {results.map((result, idx) => {
                      const domain = new URL(result.uri).hostname;
                      return (
                        <motion.button
                          key={idx}
                          onClick={() => {
                            setActiveUrl(result.uri);
                          }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group block w-full text-left p-5 bg-[#101828]/50 border border-white/5 rounded-2xl hover:bg-[#101828] hover:border-white/10 transition-all"
                        >
                          <div className="flex gap-4">
                            <div className="flex-1 flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} 
                                    alt="favicon" 
                                    className="w-4 h-4 object-contain rounded-full bg-white/10"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                  <span className="text-xs font-medium text-neutral-400">
                                    {domain}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReadWithAI(result.uri);
                                    }}
                                    className="p-1.5 bg-white/5 rounded-full text-neutral-500 hover:text-blue-400 hover:bg-white/10 transition-all"
                                    title="AI Summary"
                                  >
                                    <Sparkles size={14} />
                                  </button>
                                  <div className="p-1.5 bg-white/5 rounded-full text-neutral-500 group-hover:text-white transition-all">
                                    <ExternalLink size={14} />
                                  </div>
                                </div>
                              </div>
                              <h3 className="text-lg font-medium text-neutral-200 group-hover:text-white transition-colors">
                                {result.title}
                              </h3>
                              {result.snippet && (
                                <p className="text-sm text-neutral-300 line-clamp-2 leading-relaxed">
                                  {result.snippet}
                                </p>
                              )}
                            </div>
                            {result.imageUrl && (
                              <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                                <img 
                                  src={result.imageUrl} 
                                  alt="thumbnail" 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Knowledge Panel (Desktop Right) */}
            {(knowledgePanel || isGeneratingKg) && (
              <div className="hidden lg:block w-[350px] flex-shrink-0 sticky top-24">
                {isGeneratingKg ? (
                  <div className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 animate-pulse">
                    <div className="h-48 bg-neutral-900 rounded-xl mb-4"></div>
                    <div className="h-6 bg-neutral-900 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-neutral-900 rounded w-1/2 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-neutral-900 rounded w-full"></div>
                      <div className="h-3 bg-neutral-900 rounded w-full"></div>
                      <div className="h-3 bg-neutral-900 rounded w-2/3"></div>
                    </div>
                  </div>
                ) : (
                  <KnowledgePanelComponent 
                    panel={knowledgePanel} 
                    onAttributeClick={(q) => {
                      setQuery(q);
                      handleSearch(undefined, q);
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowLoginModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-[#0A0A0A] border border-neutral-800 p-8 rounded-xl shadow-2xl w-full max-w-sm flex flex-col items-center text-center"
            >
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black font-bold text-2xl mb-6">
                S
              </div>
              <h2 className="text-2xl font-sans font-semibold text-white mb-2 tracking-tight">Welcome Back</h2>
              <p className="text-neutral-400 text-sm mb-8">Sign in to sync your search history and preferences.</p>
              
              <div className="w-full">
                <LoginWithSanscounts onLoginSuccess={(userData) => {
                  setUser(userData);
                  setShowLoginModal(false);
                }} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
