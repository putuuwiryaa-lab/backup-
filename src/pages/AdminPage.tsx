import React, { useState, useEffect } from 'react';
import { Trash2, Lock, ChevronUp, ChevronDown, Settings, List } from "lucide-react";
import { supabase } from "../App";

export default function AdminPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<'markets' | 'settings'>('markets');
  const [marketsList, setMarketsList] = useState<any[]>([]);
  const [selectedMarket, setSelectedMarket] = useState('');
  const [newMarketId, setNewMarketId] = useState('');
  const [historyData, setHistoryData] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [runningText, setRunningText] = useState('SUPREME ENGINE v2.0 - SISTEM PREDIKSI PASARAN TERAKURAT');
  const [systemStatus, setSystemStatus] = useState('ONLINE');
  const [appVersion, setAppVersion] = useState('v5.0');
  const [token, setToken] = useState('');

  const fetchMarkets = async () => {
    try {
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .order('order', { ascending: true });
      if (error) throw error;
      const sorted = (data || []) as any[];
      setMarketsList(sorted);
      if (sorted.length > 0) {
        setSelectedMarket(sorted[0].id);
        setHistoryData(sorted[0].history_data || '');
      }
    } catch (e) {
      console.error("Fetch error:", e);
    }
  };
