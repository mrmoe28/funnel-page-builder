"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink, Calendar, Sparkles } from "lucide-react";

export interface FunnelHistoryItem {
  slug: string;
  appName: string;
  targetUrl: string;
  previewUrl: string;
  createdAt: string;
  thumbnail?: string;
}

interface FunnelHistorySidebarProps {
  onSelectFunnel?: (item: FunnelHistoryItem) => void;
}

export function FunnelHistorySidebar({ onSelectFunnel }: FunnelHistorySidebarProps) {
  const [history, setHistory] = useState<FunnelHistoryItem[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('sidebarToggle', {
      detail: { isCollapsed: newState }
    }));
  };

  // Load history from localStorage
  useEffect(() => {
    const loadHistory = () => {
      try {
        const stored = localStorage.getItem("funnelHistory");
        if (stored) {
          const parsed = JSON.parse(stored);
          setHistory(parsed);
        }
      } catch (e) {
        console.error("Failed to load history:", e);
      }
    };

    loadHistory();

    // Listen for history updates
    const handleStorageChange = () => {
      loadHistory();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("funnelHistoryUpdate", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("funnelHistoryUpdate", handleStorageChange);
    };
  }, []);

  const deleteFunnel = (slug: string) => {
    const updated = history.filter((item) => item.slug !== slug);
    setHistory(updated);
    localStorage.setItem("funnelHistory", JSON.stringify(updated));
    window.dispatchEvent(new Event("funnelHistoryUpdate"));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-background/95 backdrop-blur-xl border-r border-border/50 transition-all duration-300 z-40 hidden md:block ${
        isCollapsed ? "w-16" : "w-80"
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-4 top-4 w-8 h-8 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform z-50"
      >
        {isCollapsed ? "→" : "←"}
      </button>

      {/* Collapsed State - Show only icon */}
      {isCollapsed && (
        <div className="flex flex-col h-full items-center py-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{history.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Expanded State */}
      {!isCollapsed && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Funnel History</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {history.length} funnel{history.length !== 1 ? "s" : ""} created
            </p>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-3">
                  <Sparkles className="h-8 w-8 text-primary/50" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No funnels yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create your first funnel to get started!
                </p>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.slug}
                  className="glass rounded-xl overflow-hidden hover:shadow-lg transition-all group"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.appName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Sparkles className="h-8 w-8 text-primary/30" />
                      </div>
                    )}

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 px-3"
                        onClick={() => window.open(item.previewUrl, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${item.appName}"?`)) {
                            deleteFunnel(item.slug);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm truncate mb-1">
                      {item.appName}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mb-2">
                      {item.targetUrl}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {history.length > 0 && (
            <div className="p-4 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  if (confirm("Delete all funnel history?")) {
                    setHistory([]);
                    localStorage.removeItem("funnelHistory");
                    window.dispatchEvent(new Event("funnelHistoryUpdate"));
                  }
                }}
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Clear All
              </Button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

// Helper function to add item to history (call this from page.tsx)
export function addToFunnelHistory(item: Omit<FunnelHistoryItem, "createdAt">) {
  try {
    const stored = localStorage.getItem("funnelHistory");
    const history: FunnelHistoryItem[] = stored ? JSON.parse(stored) : [];

    // Add new item with timestamp
    const newItem: FunnelHistoryItem = {
      ...item,
      createdAt: new Date().toISOString(),
    };

    // Check if already exists (update instead of duplicate)
    const existingIndex = history.findIndex((h) => h.slug === item.slug);
    if (existingIndex >= 0) {
      history[existingIndex] = newItem;
    } else {
      history.unshift(newItem); // Add to beginning
    }

    // Keep only last 50 items
    const trimmed = history.slice(0, 50);

    localStorage.setItem("funnelHistory", JSON.stringify(trimmed));
    window.dispatchEvent(new Event("funnelHistoryUpdate"));
  } catch (e) {
    console.error("Failed to save to history:", e);
  }
}
