/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Search, Globe, Clock, ArrowRight, Sparkles, X, Menu, ExternalLink, ChevronRight, Home, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { LoginWithSanscounts } from './components/LoginWithSanscounts';

// Search result interfaces
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
      className="w-full bg-[#011e38]/50 backdrop-blur-3xl backdrop-blur-2xl border border-brand-cyan/20 rounded-3xl overflow-hidden shadow-2xl shadow-black/30"
    >
      {(panel.imageUrl || panel.image) && (
        <div className="w-full aspect-[4/3] overflow-hidden bg-[#011e38]/50 backdrop-blur-3xl relative">
          <img 
            src={panel.imageUrl || panel.image} 
            alt={panel.title} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none"></div>
        </div>
      )}
      <div className="p-8">
        <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">
          {panel.title}
          {panel.isAiGenerated && (
            <Sparkles size={20} className="inline-block ml-3 text-brand-blue animate-pulse" />
          )}
        </h2>
        {panel.type && (
          <p className="text-sm font-bold text-brand-blue mb-6 uppercase tracking-widest">{panel.type}</p>
        )}
        
        {panel.description && (
          <p className="text-base text-brand-light/90 leading-relaxed mb-8">
            {panel.description}
            {panel.descriptionLink && (
              <a 
                href={panel.descriptionLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-brand-blue font-bold hover:underline ml-2"
              >
                Read More
              </a>
            )}
          </p>
        )}

        {panel.attributes && Object.keys(panel.attributes).length > 0 && (
          <div className="space-y-4 border-t border-brand-cyan/20 pt-6">
            {Object.entries(panel.attributes).map(([key, value]: [string, any]) => (
              <div key={key} className="text-sm">
                <span className="font-semibold text-brand-light/70 mr-2">{key}:</span>
                <button 
                  onClick={() => onAttributeClick(String(value))}
                  className="text-brand-cyan hover:underline text-left"
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
            className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 bg-[#011e38]/50 backdrop-blur-3xl hover:bg-[#011e38]/50 backdrop-blur-3xl border border-brand-cyan/20 rounded-xl text-sm font-medium text-white transition-all"
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
  const [query, setQuery] = useState(() => sessionStorage.getItem('san_slaud_query') || '');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>(() => {
    const saved = sessionStorage.getItem('san_slaud_results');
    return saved ? JSON.parse(saved) : [];
  });
  const [images, setImages] = useState<ImageResult[]>(() => {
    const saved = sessionStorage.getItem('san_slaud_images');
    return saved ? JSON.parse(saved) : [];
  });
  const [knowledgePanel, setKnowledgePanel] = useState<any>(() => {
    const saved = sessionStorage.getItem('san_slaud_kp');
    return saved ? JSON.parse(saved) : null;
  });
  const [answer, setAnswer] = useState<string | null>(() => sessionStorage.getItem('san_slaud_answer') || null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isGeneratingKg, setIsGeneratingKg] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleReadWithAI = async (url: string) => {
    setIsReading(true);
    setAnswer(null);
    try {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) throw new Error("Gemini API Key is missing.");
      
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: `Please visit this URL: ${url} and provide a comprehensive, well-formatted summary of its content. Include key points, main arguments, and any important details so I don't have to visit the site directly. Format with clear headings and bullet points.` }] }],
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      setAnswer(response.text);
    } catch (err: any) {
      setError(err.message || "AI couldn't read this site. Please try opening it in a new tab.");
    } finally {
      setIsReading(false);
    }
  };

  useEffect(() => {
    sessionStorage.setItem('san_slaud_results', JSON.stringify(results));
    sessionStorage.setItem('san_slaud_images', JSON.stringify(images));
    sessionStorage.setItem('san_slaud_answer', answer || '');
    sessionStorage.setItem('san_slaud_kp', JSON.stringify(knowledgePanel));
    sessionStorage.setItem('san_slaud_query', query);
  }, [results, images, answer, knowledgePanel, query]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('san_slaud_history');
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
    localStorage.setItem('san_slaud_history', JSON.stringify(newHistory));
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
      window.open(finalUrl, '_blank');
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
    saveToHistory(activeQuery);
    setShowHistory(false);

    let currentKg: any = null;

    // Filter for gambling/betting/casino sites
    const isGamblingSite = (text: string) => {
      if (!text) return false;
      const gamblingKeywords = [
        'casino', 'gambling', 'betting', 'juy', 'poker', 'slot', 'jackpot', 'lottery', 
        '1xbet', 'melbet', 'bet365', 'betway', 'parimatch', 'mcw', 'babu88', 'baji', 
        'linebet', 'mostbet', 'megapari', 'dhamaka', 'jeeto', 'khela88', 'velki', 
        't20exchange', 'cricketbetting', 'wager', 'staking', 'জুয়া', 'জুয়াড়ি', 'বাজি', 'ক্যাসিনো'
      ];
      return gamblingKeywords.some(keyword => text.toLowerCase().includes(keyword));
    };

    if (isGamblingSite(activeQuery)) {
      setError("আমাদের অনুসন্ধান ইঞ্জিন জুয়া বা ক্যাসিনো সম্পর্কিত কোনো সাইট প্রদর্শন করে না। অনুগ্রহ করে নিরাপদ ইন্টারনেট ব্যবহারের চেষ্টা করুন।");
      setIsSearching(false);
      setIsGeneratingKg(false);
      return;
    }

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
      // Ensure we don't show "No results" for special cases
    }

    try {
      // Robust Key Detection: Use environment variable if valid, otherwise fallback to hardcoded key
      const envSerper = (process.env.VITE_SERPER_API_KEY || import.meta.env.VITE_SERPER_API_KEY || "").trim();
      const serperKey = (envSerper.length > 10) ? envSerper : '8eb3b36eaebc77d5d951cb868e6a545fa253403c';
      
      const geminiKey = process.env.GEMINI_API_KEY;
      let serperSuccess = false;
      let hasAnyResults = false;

      // Initialize Gemini inside search to ensure latest key
      const ai = new GoogleGenAI({ apiKey: geminiKey || '' });

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
              throw new Error(`Serper Organic Error: ${res.status} ${errorText.substring(0, 50)}`);
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
              throw new Error(`Serper Images Error: ${res.status} ${errorText.substring(0, 50)}`);
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
            if (filteredResults.length > 0) hasAnyResults = true;
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
            if (filteredImages.length > 0) hasAnyResults = true;
          }
          
          if (data.answerBox) {
            setAnswer(data.answerBox.snippet || data.answerBox.answer || null);
            hasAnyResults = true;
          } 
          
          if (data.knowledgeGraph && !currentKg) {
            currentKg = data.knowledgeGraph;
            if (!currentKg.imageUrl && imageData.images && imageData.images[0]) {
              currentKg.imageUrl = imageData.images[0].imageUrl;
            }
            setKnowledgePanel(currentKg);
            hasAnyResults = true;
          }
          serperSuccess = true;
        } catch (serperErr) {
          console.error("Serper API failed, falling back to Gemini:", serperErr);
          // Continue to Gemini fallback below
        }
      }

      if (!serperSuccess) {
        let fallbackResults: any[] = [];
        // ALWAYS Fetch Wikipedia for some good primary links
        try {
          const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(activeQuery)}&utf8=&format=json&origin=*`);
          const wikiData = await wikiRes.json();
          if (wikiData.query && wikiData.query.search && wikiData.query.search.length > 0) {
            fallbackResults = wikiData.query.search
              .filter((item: any) => !isGamblingSite(item.title) && !isGamblingSite(item.snippet))
              .map((item: any) => ({
                title: item.title,
                uri: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
                snippet: item.snippet.replace(/<\/?[^>]+(>|$)/g, ""), // Strip HTML tags
              }));
            setResults(fallbackResults);
            hasAnyResults = true;
            
            // Also try to get a summary for the first result
            try {
              const firstTitle = wikiData.query.search[0].title;
              const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstTitle)}`);
              if (summaryRes.ok) {
                const summaryData = await summaryRes.json();
                if (summaryData.extract) {
                  setAnswer(summaryData.extract);
                  if (summaryData.thumbnail) {
                    setKnowledgePanel({
                      title: summaryData.title,
                      type: summaryData.description || "Wikipedia Article",
                      description: summaryData.extract,
                      imageUrl: summaryData.thumbnail.source,
                      attributes: {},
                      isAiGenerated: false
                    });
                  }
                }
              }
            } catch (summaryErr) {
              console.error("Wikipedia summary fetch failed:", summaryErr);
            }
          }
        } catch (wikiErr) {
          console.error("Wikipedia fallback failed:", wikiErr);
        }

        // Now Try Gemini Stream if API key exists
        if (geminiKey) {
          try {
            // Fallback to Gemini with Streaming for faster perceived performance
            const responseStream = await ai.models.generateContentStream({
              model: "gemini-2.5-flash",
              contents: [{ role: 'user', parts: [{ text: activeQuery }] }],
              config: {
                systemInstruction: "You are San Slaud, a highly precise and accurate general search engine. You MUST use the googleSearch tool to find EXACT, real-world information, websites, and factual data for the user's query. If the user searches for a website like 'YouTube' or 'Facebook', provide the direct link and a brief description. Do not hallucinate. Format your response beautifully using markdown.",
                tools: [{ googleSearch: {} }],
              },
            });

            let fullText = '';
            let foundResults = false;
            
            for await (const chunk of responseStream) {
              if (chunk.text) {
                fullText += chunk.text;
                // If we get an answer stream, prefer that over wikipedia's summary
                setAnswer(fullText);
                hasAnyResults = true;
              }
              
              if (!foundResults && fallbackResults.length === 0) {
                const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
                if (chunks) {
                  const extractedResults = chunks
                    .filter((c: any) => c.web && !isGamblingSite(c.web.title) && !isGamblingSite(c.web.uri))
                    .map((c: any) => ({
                      title: c.web?.title || 'Untitled',
                      uri: c.web?.uri || '',
                    }));
                  if (extractedResults.length > 0) {
                    setResults(extractedResults);
                    foundResults = true;
                    hasAnyResults = true;
                  }
                }
              }
            }
          } catch (gemErr) {
            console.error("Gemini stream fallback failed:", gemErr);
          }
        }
        
        if (!hasAnyResults) {
          setAnswer("No comprehensive results found. Please modify your query.");
          hasAnyResults = true;
        }
      }

      // AI Knowledge Panel Fallback (Run if no KG found so far)
      if (!currentKg) {
        try {
          const aiPanelResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Create a structured knowledge panel for the query: "${activeQuery}". 
            Provide a comprehensive, factual, and professional summary of this topic.
            Return a JSON object with exactly these fields:
            - title: The name or topic
            - type: Category or brief label (e.g., "Person", "City", "Technology")
            - description: A detailed 2-3 paragraph professional summary
            - imageUrl: A direct public URL to a high-quality image related to this topic. Use a reliable source like Wikipedia or a high-quality placeholder if unknown.
            - attributes: A small object with 4-6 key facts as key-value pairs.
            
            Return ONLY the raw JSON object. Do not include markdown formatting or backticks.` }] }],
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
                hasAnyResults = true;
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

      // Final check: if we have no results, no answer, and no knowledge panel, it's a failed search
      if (!hasAnyResults && !currentKg && !answer) {
        setError("No results found for this query. Please try different keywords.");
      }
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || "Failed to fetch results. Please check your connection or API key.");
    } finally {
      setIsSearching(false);
      setIsGeneratingKg(false); // Safety net
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('san_slaud_history');
  };

  // Quick Apps Data
  return (
    <div className="min-h-screen flex flex-col items-center text-brand-light font-sans">
      {/* Navigation / Header */}
      <header className="w-full px-6 py-4 flex justify-between items-center z-50 border-b border-brand-cyan/20 bg-transparent/50 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => {
          setResults([]);
          setImages([]);
          setAnswer(null);
          setQuery('');
          setKnowledgePanel(null);
          setError(null);
        }}>
          <div className="w-9 h-9 rounded-xl bg-[#011e38]/50 backdrop-blur-3xl flex items-center justify-center text-brand-blue font-bold text-xl shadow-[0_0_20px_rgba(255,255,255,0.8)] group-hover:scale-110 transition-all relative ring-2 ring-white/20">
            S
          </div>
          <span className="font-sans font-bold text-2xl tracking-tight text-white drop-shadow-sm group-hover:text-brand-light/70 transition-colors">San Slaud</span>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("App URL copied! Use this link in your phone's browser.");
            }}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#011e38]/50 backdrop-blur-3xl hover:bg-[#011e38]/50 backdrop-blur-3xl border border-brand-cyan/20 rounded-full text-xs font-bold text-brand-cyan hover:text-brand-cyan transition-all shadow-sm"
          >
            <ExternalLink size={14} />
            Copy App URL
          </button>
          <div className="flex items-center gap-3">
          </div>
          {user ? (
            <div className="flex items-center gap-3 bg-[#011e38]/50 backdrop-blur-3xl backdrop-blur-xl border border-brand-cyan/20 px-4 py-2 rounded-2xl shadow-sm">
              <img src={user.avatar || "https://i.postimg.cc/wvXS9k1D/IMG-9128.jpg"} alt="Avatar" className="w-7 h-7 rounded-full object-cover ring-2 ring-sky-200" referrerPolicy="no-referrer" />
              <span className="text-sm font-bold text-white">{user.name || 'User'}</span>
              <button onClick={() => setUser(null)} className="text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors ml-2">Logout</button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-6 py-2 bg-sky-500 text-white text-sm font-bold rounded-xl hover:bg-sky-600 transition-all shadow-lg shadow-brand-blue/20"
            >
              Sign in
            </button>
          )}
          <button className="p-1.5 text-brand-cyan hover:text-white transition-colors">
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
              <h1 className="font-sans font-black text-6xl md:text-8xl mb-8 tracking-tighter text-white drop-shadow-sm">
                San Slaud.
              </h1>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Search Bar Container */}
        <div className={`w-full transition-all duration-500 ${results.length || answer || isSearching ? 'mt-0' : 'mt-0'}`}>
          <form onSubmit={handleSearch} className="relative group">
            <div className="relative flex items-center bg-[#011e38]/50 backdrop-blur-3xl backdrop-blur-2xl rounded-2xl border border-brand-cyan/20 overflow-hidden shadow-lg shadow-black/30 focus-within:ring-2 focus-within:ring-sky-300 transition-all">
              <div className="pl-5 text-brand-blue">
                <Search size={22} className="group-focus-within:text-brand-blue transition-colors" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowHistory(true)}
                placeholder="Search the infinite sky..."
                className="w-full py-5 px-4 text-lg bg-transparent border-none focus:ring-0 outline-none text-white placeholder-blue-300 font-sans font-medium"
              />
              <div className="flex items-center gap-2 pr-3">
                <button
                  type="submit"
                  disabled={isSearching || !query.trim()}
                  className="p-3 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-brand-blue/20"
                >
                  {isSearching ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <Globe size={20} />
                    </motion.div>
                  ) : (
                    <ArrowRight size={20} />
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
                <span className="text-[10px] text-brand-cyan font-medium flex items-center gap-1">
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
                  className="absolute top-full left-0 right-0 mt-2 bg-[#011e38]/50 backdrop-blur-3xl backdrop-blur-xl rounded-xl border border-brand-cyan/20 overflow-hidden z-[60] shadow-2xl"
                >
                  <div className="p-4 border-b border-brand-cyan/20 flex justify-between items-center bg-transparent/50">
                    <span className="text-xs font-medium text-brand-cyan flex items-center gap-2">
                      <Clock size={14} /> Recent Searches
                    </span>
                    <button
                      type="button"
                      onClick={clearHistory}
                      className="text-xs text-brand-cyan hover:text-white transition-colors"
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
                        className="w-full px-5 py-3 text-left hover:bg-[#011e38]/50 backdrop-blur-3xl flex items-center justify-between group transition-colors"
                      >
                        <span className="text-brand-light/90 group-hover:text-white transition-colors">{item.query}</span>
                        <ChevronRight size={16} className="text-brand-cyan group-hover:text-white transition-colors" />
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
              <div className="h-3 bg-[#011e38]/50 backdrop-blur-3xl rounded-full w-full animate-pulse"></div>
              <div className="h-3 bg-[#011e38]/50 backdrop-blur-3xl rounded-full w-5/6 animate-pulse"></div>
              <div className="h-3 bg-[#011e38]/50 backdrop-blur-3xl rounded-full w-4/6 animate-pulse"></div>
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
            <div className="block lg:hidden w-full mb-10 p-4 bg-[#011e38]/50 backdrop-blur-3xl rounded-3xl border border-brand-cyan/20 shadow-2xl">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-brand-cyan" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-cyan">AI Knowledge Summary</span>
                </div>
              </div>
              {isGeneratingKg ? (
                  <div className="w-full bg-[#011e38]/50 backdrop-blur-3xl backdrop-blur-xl border border-brand-cyan/20 rounded-2xl p-6 animate-pulse">
                    <div className="h-48 bg-[#011e38]/50 backdrop-blur-3xl rounded-xl mb-4"></div>
                    <div className="h-6 bg-[#011e38]/50 backdrop-blur-3xl rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-[#011e38]/50 backdrop-blur-3xl rounded w-1/2 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-[#011e38]/50 backdrop-blur-3xl rounded w-full"></div>
                      <div className="h-3 bg-[#011e38]/50 backdrop-blur-3xl rounded w-full"></div>
                      <div className="h-3 bg-[#011e38]/50 backdrop-blur-3xl rounded w-2/3"></div>
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
                  className="vercel-card p-6 md:p-10 rounded-3xl w-full border-t-4 border-t-brand-blue"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-white">
                      <Sparkles size={18} className="text-brand-cyan" />
                      <span className="text-sm font-medium">{isReading ? 'AI is reading the page...' : 'AI Reader Mode'}</span>
                    </div>
                    {!isReading && (
                      <button onClick={() => setAnswer(null)} className="text-brand-cyan hover:text-white transition-colors">
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  {isReading ? (
                    <div className="space-y-4">
                      <div className="h-3 bg-[#011e38]/50 backdrop-blur-3xl rounded-full w-full animate-pulse"></div>
                      <div className="h-3 bg-[#011e38]/50 backdrop-blur-3xl rounded-full w-5/6 animate-pulse"></div>
                      <div className="h-3 bg-[#011e38]/50 backdrop-blur-3xl rounded-full w-4/6 animate-pulse"></div>
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
                  <div className="flex items-center gap-2 text-brand-cyan mb-4 px-1">
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
                        onClick={() => window.open(img.link, '_blank')}
                      >
                        <div className="aspect-square rounded-2xl overflow-hidden bg-[#011e38]/50 backdrop-blur-3xl border border-brand-cyan/20 mb-2 shadow-sm group-hover:shadow-lg group-hover:shadow-brand-blue/20 transition-all">
                          <img 
                            src={img.imageUrl} 
                            alt={img.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <p className="text-[10px] text-brand-light/70 line-clamp-1 px-1">{img.title}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {results.length > 0 && (
                <div className="w-full">
                  <div className="flex items-center gap-2 text-brand-cyan mb-4 px-1">
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
                            window.open(result.uri, '_blank');
                          }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group block w-full text-left p-6 bg-[#011e38]/50 backdrop-blur-3xl backdrop-blur-xl border border-brand-cyan/20 rounded-3xl hover:bg-[#011e38]/50 backdrop-blur-3xl hover:shadow-2xl hover:shadow-brand-blue/20 hover:-translate-y-2 transition-all border-b-4 border-b-transparent hover:border-b-brand-blue shadow-md shadow-black/30"
                        >
                          <div className="flex gap-4">
                            <div className="flex-1 flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} 
                                    alt="favicon" 
                                    className="w-4 h-4 object-contain rounded-full bg-[#011e38]/50 backdrop-blur-3xl"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                  <span className="text-xs font-medium text-brand-light/70">
                                    {domain}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReadWithAI(result.uri);
                                    }}
                                    className="p-1.5 bg-[#011e38]/50 backdrop-blur-3xl rounded-full text-brand-cyan hover:text-brand-cyan hover:bg-[#011e38]/50 backdrop-blur-3xl transition-all"
                                    title="AI Summary"
                                  >
                                    <Sparkles size={14} />
                                  </button>
                                  <div className="p-1.5 bg-[#011e38]/50 backdrop-blur-3xl rounded-full text-brand-cyan group-hover:text-white transition-all">
                                    <ExternalLink size={14} />
                                  </div>
                                </div>
                              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-brand-cyan transition-colors tracking-tight">
                {result.title}
              </h3>
                              {result.snippet && (
                                <p className="text-sm text-brand-light/90 line-clamp-2 leading-relaxed">
                                  {result.snippet}
                                </p>
                              )}
                            </div>
                            {result.imageUrl && (
                                <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border border-brand-cyan/20 shadow-inner bg-[#011e38]/50 backdrop-blur-3xl">
                                  <img 
                                    src={result.imageUrl} 
                                    alt="thumbnail" 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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
                  <div className="w-full bg-[#011e38]/50 backdrop-blur-3xl backdrop-blur-xl border border-brand-cyan/20 rounded-2xl p-6 animate-pulse">
                    <div className="h-48 bg-[#011e38]/50 backdrop-blur-3xl rounded-xl mb-4"></div>
                    <div className="h-6 bg-[#011e38]/50 backdrop-blur-3xl rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-[#011e38]/50 backdrop-blur-3xl rounded w-1/2 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-[#011e38]/50 backdrop-blur-3xl rounded w-full"></div>
                      <div className="h-3 bg-[#011e38]/50 backdrop-blur-3xl rounded w-full"></div>
                      <div className="h-3 bg-[#011e38]/50 backdrop-blur-3xl rounded w-2/3"></div>
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
              className="absolute inset-0 bg-transparent/80 backdrop-blur-sm"
              onClick={() => setShowLoginModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-[#011e38]/50 backdrop-blur-3xl backdrop-blur-2xl border border-brand-cyan/20 p-10 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-md flex flex-col items-center text-center overflow-hidden border-b-[6px] border-b-brand-blue"
            >
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="absolute top-4 right-4 text-brand-light/70 hover:text-brand-blue transition-colors p-1"
                >
                  <X size={24} />
                </button>
                <div className="w-14 h-14 rounded-2xl bg-brand-blue flex items-center justify-center text-brand-blue font-bold text-3xl mb-6 shadow-lg shadow-brand-blue/20 ring-2 ring-sky-50">
                  S
                </div>
                <h2 className="text-3xl font-sans font-black text-white mb-3 tracking-tighter">Skybound Welcome</h2>
                <p className="text-brand-light/70 font-medium text-sm mb-10 px-4">Begin your journey across the infinite sky of information. Your preferences will sync across all horizons.</p>
              
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
