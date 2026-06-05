import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Search, Edit3, Trash2, Scale, Calendar, 
  ChevronRight, Wheat, MapPin, Phone, RefreshCw, X, Info,
  Maximize2, Minimize2, ArrowUpDown, SlidersHorizontal
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import type { 
  PaddySupplierDetail, PaddySupplierYoYReport, 
  PaddyProcurementAnalytics
} from '../types';

interface PaddyVendorsViewProps {
  isCompareMode: boolean;
  onToggleCompareMode: (compare: boolean) => void;
  addMutationLog: (message: string, action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOCK' | 'ERROR', entity: 'Supplier' | 'Delivery' | 'Employee' | 'Attendance' | 'Cash Advance' | 'Cycle') => void;
  showToast: (message: string, isError?: boolean) => void;
}

export default function PaddyVendorsView({ 
  isCompareMode, 
  onToggleCompareMode, 
  addMutationLog, 
  showToast 
}: PaddyVendorsViewProps) {
  const [suppliers, setSuppliers] = useState<PaddySupplierDetail[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [supplierDetail, setSupplierDetail] = useState<PaddySupplierDetail | null>(null);
  const [yoyReport, setYoyReport] = useState<PaddySupplierYoYReport | null>(null);
  const [_analytics, setAnalytics] = useState<PaddyProcurementAnalytics | null>(null);
  
  // UI Control states
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // Advanced filters toggle
  const [showInlineFilters, setShowInlineFilters] = useState(false);

  // Helper to parse sorting states from URL hash query params
  const getSortFromHash = () => {
    const hash = window.location.hash;
    if (hash.includes('?')) {
      const searchParams = new URLSearchParams(hash.split('?')[1]);
      const sort = searchParams.get('sort');
      const order = searchParams.get('order');
      
      const validSorts = ['supplier_id', 'name', 'location', 'deliveries_count', 'cumulative_weight', 'last_delivery_date'];
      const validOrders = ['asc', 'desc'];
      
      return {
        sortBy: validSorts.includes(sort || '') ? (sort as any) : 'supplier_id',
        sortOrder: validOrders.includes(order || '') ? (order as any) : 'asc'
      };
    }
    return { sortBy: 'supplier_id', sortOrder: 'asc' };
  };

  const initialSort = getSortFromHash();

  const [sortBy, setSortBy] = useState<'supplier_id' | 'name' | 'location' | 'deliveries_count' | 'cumulative_weight' | 'last_delivery_date'>(initialSort.sortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSort.sortOrder);
  const [lastFilterHash, setLastFilterHash] = useState('');

  // Filtering states
  const [filterLocation, setFilterLocation] = useState('All');
  const [filterVariety, setFilterVariety] = useState('All');
  const [minWeight, setMinWeight] = useState<number>(0);
  const [timePeriod, setTimePeriod] = useState<string>('All-Time'); // 'All-Time' or specific calendar year (e.g. '2026')
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  
  // Supplier form state
  const [supplierName, setSupplierName] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [supplierLocation, setSupplierLocation] = useState('');

  // Delivery form state
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().substring(0, 10));
  const [deliveryVariety, setDeliveryVariety] = useState('Ranjit');
  const [customVariety, setCustomVariety] = useState('');
  const [deliveryWeight, setDeliveryWeight] = useState<number>(0);

  // Fetch initial suppliers and dashboard statistics
  useEffect(() => {
    fetchSuppliers();
    fetchAnalytics();
  }, []);

  // Fetch selected supplier details when selected supplier changes
  useEffect(() => {
    if (selectedSupplierId) {
      fetchSupplierDetails(selectedSupplierId);
    } else {
      setSupplierDetail(null);
      setYoyReport(null);
    }
  }, [selectedSupplierId]);

  // Update URL hash query params when sorting changes
  useEffect(() => {
    const cleanHash = window.location.hash.split('?')[0];
    const newHash = `${cleanHash}?sort=${sortBy}&order=${sortOrder}`;
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }
  }, [sortBy, sortOrder]);

  // Synchronize state when the URL hash query params change externally (e.g. back button)
  useEffect(() => {
    const handleHashChange = () => {
      const parsed = getSortFromHash();
      setSortBy(parsed.sortBy);
      setSortOrder(parsed.sortOrder);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);



  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/paddy/suppliers`);
      setSuppliers(res.data);
      // Auto-select first supplier if list has entries and none selected
      if (res.data.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(res.data[0].id);
      }
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to fetch supplier registry', true);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/paddy/analytics`);
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load procurement analytics', err);
    }
  };

  const fetchSupplierDetails = async (id: number) => {
    setDetailLoading(true);
    try {
      const [detailRes, yoyRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/paddy/suppliers/${id}`),
        axios.get(`${API_BASE_URL}/api/paddy/suppliers/${id}/yoy`)
      ]);
      setSupplierDetail(detailRes.data);
      setYoyReport(yoyRes.data);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to load supplier profile details', true);
    } finally {
      setDetailLoading(false);
    }
  };

  // Add new Supplier profile
  const handleRegisterSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || !supplierContact.trim() || !supplierLocation.trim()) {
      showToast('All fields are required to register a supplier profile', true);
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/api/paddy/suppliers`, {
        name: supplierName,
        contact_number: supplierContact,
        location: supplierLocation
      });
      showToast('Supplier successfully registered');
      addMutationLog(
        `Registered paddy supplier '${supplierName}' (${res.data.supplier_id})`,
        'CREATE',
        'Supplier'
      );
      
      // Reset form & reload
      setSupplierName('');
      setSupplierContact('');
      setSupplierLocation('');
      setShowAddModal(false);
      
      // Set newly created supplier as selected
      setSelectedSupplierId(res.data.id);
      onToggleCompareMode(false);
      fetchSuppliers();
      fetchAnalytics();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to register supplier';
      showToast(errMsg, true);
      addMutationLog(`Failed to register supplier '${supplierName}': ${errMsg}`, 'ERROR', 'Supplier');
    }
  };

  // Update existing Supplier profile
  const handleUpdateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || !supplierDetail) return;
    if (!supplierName.trim() || !supplierContact.trim() || !supplierLocation.trim()) {
      showToast('All fields are required to update supplier registry profile', true);
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/api/paddy/suppliers/${selectedSupplierId}`, {
        name: supplierName,
        contact_number: supplierContact,
        location: supplierLocation
      });
      showToast('Supplier registry profile updated successfully');
      addMutationLog(
        `Updated registry metadata for '${supplierName}' (${supplierDetail.supplier_id})`,
        'UPDATE',
        'Supplier'
      );
      
      setShowEditModal(false);
      fetchSuppliers();
      fetchSupplierDetails(selectedSupplierId);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to update supplier profile';
      showToast(errMsg, true);
      addMutationLog(`Failed to update supplier profile: ${errMsg}`, 'ERROR', 'Supplier');
    }
  };

  // Delete/Deregister Supplier
  const handleDeleteSupplier = async () => {
    if (!selectedSupplierId || !supplierDetail) return;
    if (window.confirm(`CRITICAL WARNING:\n\nAre you sure you want to deregister supplier '${supplierDetail.name}' (${supplierDetail.supplier_id})?\n\nThis will permanently delete their profile and ALL associated seasonal quantity delivery logs. This action cannot be undone.`)) {
      try {
        await axios.delete(`${API_BASE_URL}/api/paddy/suppliers/${selectedSupplierId}`);
        showToast('Supplier profile successfully deregistered');
        addMutationLog(
          `Deregistered paddy supplier '${supplierDetail.name}' (${supplierDetail.supplier_id})`,
          'DELETE',
          'Supplier'
        );
        
        setSelectedSupplierId(null);
        setSupplierDetail(null);
        setYoyReport(null);
        
        fetchSuppliers();
        fetchAnalytics();
      } catch (err: any) {
        showToast(err.response?.data?.detail || 'Failed to delete supplier profile', true);
      }
    }
  };

  // Log seasonal Paddy crop delivery
  const handleLogDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || !supplierDetail) return;
    
    const finalVariety = deliveryVariety === 'Custom' ? customVariety : deliveryVariety;
    if (!finalVariety.trim()) {
      showToast('Please specify a paddy variety or classification classification', true);
      return;
    }
    
    if (Number(deliveryWeight) <= 0) {
      showToast('Net payload weight must be greater than zero', true);
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/paddy/suppliers/${selectedSupplierId}/deliveries`, {
        delivery_date: deliveryDate,
        variety: finalVariety,
        weight: Number(deliveryWeight)
      });
      showToast('Paddy crop delivery logged successfully');
      addMutationLog(
        `Logged delivery for '${supplierDetail.name}': ${deliveryWeight} Quintals of ${finalVariety}`,
        'CREATE',
        'Delivery'
      );

      // Reset form & reload
      setDeliveryWeight(0);
      setCustomVariety('');
      setShowLogModal(false);
      
      fetchSuppliers(); // Reload whole list to sync deliveries for compare table
      fetchSupplierDetails(selectedSupplierId);
      fetchAnalytics();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to log crop delivery';
      showToast(errMsg, true);
      addMutationLog(`Failed to log paddy delivery for ${supplierDetail.name}: ${errMsg}`, 'ERROR', 'Delivery');
    }
  };

  // Delete/Void Paddy Delivery
  const handleDeleteDelivery = async (id: number, weightVal: number, varietyVal: string) => {
    if (!supplierDetail) return;
    if (window.confirm(`Are you sure you want to void this delivery record (${weightVal} Quintals of ${varietyVal})?`)) {
      try {
        await axios.delete(`${API_BASE_URL}/api/paddy/deliveries/${id}`);
        showToast('Delivery log voided successfully');
        addMutationLog(
          `Voided crop delivery for '${supplierDetail.name}': removed ${weightVal} Quintals of ${varietyVal}`,
          'DELETE',
          'Delivery'
        );

        fetchSuppliers(); // Reload to sync compare view
        fetchSupplierDetails(selectedSupplierId!);
        fetchAnalytics();
      } catch (err: any) {
        showToast(err.response?.data?.detail || 'Failed to remove delivery log', true);
      }
    }
  };

  // Extract unique filter fields from dataset dynamically
  const uniqueLocations = Array.from(new Set(suppliers.map(s => s.location).filter(Boolean))).sort();
  const uniqueVarieties = Array.from(new Set(
    suppliers.flatMap(s => s.deliveries ? s.deliveries.map(d => d.variety) : [])
  )).filter(Boolean).sort();
  const uniqueYears = Array.from(new Set(
    suppliers.flatMap(s => s.deliveries ? s.deliveries.map(d => new Date(d.delivery_date).getFullYear()) : [])
  )).filter(Boolean).sort((a, b) => b - a);

  // Compile selected time period statistics for sorting and comparison
  const processedSuppliers = suppliers.map(sup => {
    let targetDeliveries = sup.deliveries || [];
    if (timePeriod !== 'All-Time') {
      const targetYear = parseInt(timePeriod);
      targetDeliveries = targetDeliveries.filter(d => new Date(d.delivery_date).getFullYear() === targetYear);
    }
    const cumulativeWeight = targetDeliveries.reduce((sum, d) => sum + d.weight, 0);
    return {
      ...sup,
      active_deliveries_count: targetDeliveries.length,
      active_cumulative_weight: cumulativeWeight,
    };
  });

  // Apply filtering rules
  const filteredSuppliers = processedSuppliers.filter(sup => {
    const matchesSearch = 
      sup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sup.supplier_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sup.location.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesLocation = filterLocation === 'All' || sup.location === filterLocation;
    const matchesVariety = filterVariety === 'All' || (sup.deliveries && sup.deliveries.some(d => d.variety === filterVariety));
    const matchesWeight = sup.active_cumulative_weight >= minWeight;
    
    return matchesSearch && matchesLocation && matchesVariety && matchesWeight;
  });

  // Apply sorting rules
  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
    let aVal: any = undefined;
    let bVal: any = undefined;
    
    if (sortBy === 'deliveries_count') {
      aVal = a.active_deliveries_count;
      bVal = b.active_deliveries_count;
    } else if (sortBy === 'cumulative_weight') {
      aVal = a.active_cumulative_weight;
      bVal = b.active_cumulative_weight;
    } else if (sortBy === 'last_delivery_date') {
      aVal = a.deliveries && a.deliveries.length > 0
        ? Math.max(...a.deliveries.map(d => new Date(d.delivery_date).getTime()))
        : 0;
      bVal = b.deliveries && b.deliveries.length > 0
        ? Math.max(...b.deliveries.map(d => new Date(d.delivery_date).getTime()))
        : 0;
    } else {
      const key = sortBy as 'supplier_id' | 'name' | 'location';
      aVal = (a[key] || '').toString().toLowerCase();
      bVal = (b[key] || '').toString().toLowerCase();
    }
    
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Auto-select the top supplier of the sorted/filtered list when filters change or when the selected supplier is no longer in the list
  useEffect(() => {
    const currentHash = `${searchQuery}-${filterLocation}-${filterVariety}-${minWeight}-${sortBy}-${sortOrder}`;
    if (currentHash !== lastFilterHash) {
      setLastFilterHash(currentHash);
      if (sortedSuppliers.length > 0) {
        setSelectedSupplierId(sortedSuppliers[0].id);
      } else {
        setSelectedSupplierId(null);
      }
    } else if (sortedSuppliers.length > 0 && !sortedSuppliers.some(s => s.id === selectedSupplierId)) {
      setSelectedSupplierId(sortedSuppliers[0].id);
    } else if (sortedSuppliers.length === 0 && selectedSupplierId !== null) {
      setSelectedSupplierId(null);
    }
  }, [searchQuery, filterLocation, filterVariety, minWeight, sortBy, sortOrder, sortedSuppliers, selectedSupplierId, lastFilterHash]);

  // Calculate dynamic volume sum based on the active year / all-time selection
  const computedCombinedVolume = processedSuppliers.reduce((sum, s) => sum + s.active_cumulative_weight, 0);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* HEADER SECTION & COMBINED VOLUME CARD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Wheat className="h-6 w-6 text-amber-500" />
            Paddy Procurement & Supplier Management
          </h2>
          <p className="text-sm text-slate-400">
            Register raw-material suppliers, log seasonal delivery quantities, and analyze YoY volume trends.
          </p>
        </div>

        {/* Dynamic Analytics Indicator Card */}
        <div className="glass p-4 rounded-2xl flex items-center space-x-4 border-l-4 border-amber-500 min-w-[260px]">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Total Combined Volume ({timePeriod})
            </span>
            <span className="text-xl font-extrabold text-white animate-fade-in" key={timePeriod}>
              {computedCombinedVolume.toFixed(2)} Quintals
            </span>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SUPPLIER DIRECTORY */}
        <div className={`${isCompareMode ? 'lg:col-span-12' : 'lg:col-span-4'} space-y-4 transition-all duration-300`}>
          <div className="glass p-5 rounded-3xl flex flex-col space-y-4">
            
            {/* Toolbar Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 
                  onClick={() => onToggleCompareMode(!isCompareMode)}
                  className="font-extrabold text-white text-base cursor-pointer hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                  title="Click to toggle registry expansion"
                >
                  Supplier Registry
                </h3>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono font-bold">
                  {sortedSuppliers.length}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {/* Compare Mode Toggle */}
                <button
                  onClick={() => onToggleCompareMode(!isCompareMode)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 text-slate-300 hover:text-white rounded-xl font-bold text-xs transition-all duration-200 min-h-[36px]"
                  title={isCompareMode ? "Collapse to list layout" : "Expand to compare suppliers side-by-side"}
                >
                  {isCompareMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                  <span>{isCompareMode ? 'Detail View' : 'Compare Mode'}</span>
                </button>

                <button
                  onClick={() => {
                    setSupplierName('');
                    setSupplierContact('');
                    setSupplierLocation('');
                    setShowAddModal(true);
                  }}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-all duration-200 min-h-[36px]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Register</span>
                </button>
              </div>
            </div>

            {/* Search and Filters Toggle */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-4.5 w-4.5" />
                </span>
                <input
                  type="text"
                  placeholder="Search name, location, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111827] text-slate-100 rounded-xl pl-10 pr-4 py-2 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px]"
                />
              </div>

              <button
                onClick={() => setShowInlineFilters(!showInlineFilters)}
                className={`p-2 border rounded-xl transition-all duration-200 min-h-[40px] min-w-[40px] flex items-center justify-center ${
                  showInlineFilters || filterLocation !== 'All' || filterVariety !== 'All' || minWeight > 0 || timePeriod !== 'All-Time'
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
                title="Advanced filter/sort configuration"
              >
                <SlidersHorizontal className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Filters panel (Always visible in expanded mode, toggleable in list view) */}
            {(showInlineFilters || isCompareMode) && (
              <div className={`grid ${
                isCompareMode 
                  ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5' 
                  : 'grid-cols-2 gap-2.5'
              } p-4 bg-[#111827]/40 border border-slate-800/80 rounded-2xl animate-fade-in`}>
                {/* Time Period Filter (All-Time / Yearly Selector) */}
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Time Period</label>
                  <select
                    value={timePeriod}
                    onChange={(e) => setTimePeriod(e.target.value)}
                    className="w-full bg-[#111827] text-slate-100 rounded-xl px-2.5 py-1.5 border border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[34px]"
                  >
                    <option value="All-Time">All-Time</option>
                    {uniqueYears.map(year => (
                      <option key={year} value={year.toString()}>Yearly ({year})</option>
                    ))}
                  </select>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Village Location</label>
                  <select
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="w-full bg-[#111827] text-slate-100 rounded-xl px-2.5 py-1.5 border border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[34px]"
                  >
                    <option value="All">All Locations</option>
                    {uniqueLocations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {/* Variety Filter */}
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Paddy Variety</label>
                  <select
                    value={filterVariety}
                    onChange={(e) => setFilterVariety(e.target.value)}
                    className="w-full bg-[#111827] text-slate-100 rounded-xl px-2.5 py-1.5 border border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[34px]"
                  >
                    <option value="All">All Varieties</option>
                    {uniqueVarieties.map(varName => (
                      <option key={varName} value={varName}>{varName}</option>
                    ))}
                  </select>
                </div>

                {/* Minimum weight threshold */}
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Min Volume (Qtl)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50"
                    value={minWeight || ''}
                    onChange={(e) => setMinWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#111827] text-slate-100 rounded-xl px-2.5 py-1.5 border border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[34px]"
                  />
                </div>

                {/* Sorting options */}
                <div className={`flex gap-2 items-end ${!isCompareMode ? 'col-span-2' : ''}`}>
                  <div className="flex-1">
                    <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Sort Parameter</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full bg-[#111827] text-slate-100 rounded-xl px-2.5 py-1.5 border border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[34px]"
                    >
                      <option value="supplier_id">Supplier ID</option>
                      <option value="name">Supplier Name</option>
                      <option value="location">Location</option>
                      <option value="deliveries_count">Deliveries Count</option>
                      <option value="cumulative_weight">Procurement Volume</option>
                      <option value="last_delivery_date">Last Delivery Date</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="bg-[#111827] hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl p-1.5 h-[34px] w-[34px] flex items-center justify-center transition-colors"
                    title={`Sort order: ${sortOrder.toUpperCase()}`}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Render Registry directories: Narrow List or Expanded Comparison Table */}
            {!isCompareMode ? (
              /* NARROW LIST LAYOUT */
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {loading ? (
                  <div className="py-12 text-center text-slate-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    <span className="text-xs">Loading supplier registry...</span>
                  </div>
                ) : sortedSuppliers.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No suppliers found matching current filters.
                  </div>
                ) : (
                  sortedSuppliers.map((sup) => (
                    <button
                      key={sup.id}
                      onClick={() => setSelectedSupplierId(sup.id)}
                      className={`w-full glass p-3.5 rounded-2xl flex items-center justify-between text-left transition-all duration-200 border ${
                        selectedSupplierId === sup.id
                          ? 'border-indigo-500 bg-gradient-to-r from-indigo-950/40 to-slate-900/40 shadow-lg shadow-indigo-950/25'
                          : 'border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/10'
                      }`}
                    >
                      <div className="space-y-1 pr-2">
                        <span className="block text-[10px] font-mono font-bold text-indigo-400 tracking-wider">
                          {sup.supplier_id}
                        </span>
                        <h4 className="font-extrabold text-sm text-white">{sup.name}</h4>
                        
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-0.5 text-slate-500" />
                            {sup.location}
                          </span>
                          <span>•</span>
                          <span className="text-amber-500 font-extrabold">
                            {sup.active_cumulative_weight.toFixed(1)} Qtl
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`h-4.5 w-4.5 text-slate-500 transition-transform ${
                        selectedSupplierId === sup.id ? 'translate-x-0.5 text-indigo-400' : ''
                      }`} />
                    </button>
                  ))
                )}
              </div>
            ) : (
              /* WIDE COMPARE MATRIX LAYOUT */
              <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse animate-fade-in">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/25 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <th className="py-3 px-4">Supplier ID</th>
                      <th className="py-3 px-4">Supplier Name</th>
                      <th className="py-3 px-4">Village Location</th>
                      <th className="py-3 px-4">Contact Info</th>
                      <th className="py-3 px-4 text-center">Deliveries ({timePeriod})</th>
                      <th className="py-3 px-4 text-right">Volume ({timePeriod === 'All-Time' ? 'All-Time' : timePeriod})</th>
                      <th className="py-3 px-4">Paddy Varieties</th>
                      <th className="py-3 px-4 text-center w-36">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-400" />
                          <span className="text-xs">Loading supplier comparisons...</span>
                        </td>
                      </tr>
                    ) : sortedSuppliers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                          No supplier records found matching current search/filter metrics.
                        </td>
                      </tr>
                    ) : (
                      sortedSuppliers.map((sup) => {
                        const varietiesList = sup.deliveries 
                          ? Array.from(new Set(sup.deliveries.map(d => d.variety))).join(', ') 
                          : 'None';
                        return (
                          <tr 
                            key={sup.id} 
                            className={`hover:bg-slate-900/15 transition-colors ${
                              selectedSupplierId === sup.id ? 'bg-indigo-950/10' : ''
                            }`}
                          >
                            <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                              {sup.supplier_id}
                            </td>
                            <td className="py-3 px-4 font-extrabold text-white">
                              {sup.name}
                            </td>
                            <td className="py-3 px-4 text-slate-355">
                              <span className="flex items-center">
                                <MapPin className="h-3.5 w-3.5 mr-1 text-slate-500" />
                                {sup.location}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-400 font-mono">
                              {sup.contact_number}
                            </td>
                            <td className="py-3 px-4 text-center text-white font-extrabold">
                              {sup.active_deliveries_count}
                            </td>
                            <td className="py-3 px-4 text-right text-amber-500 font-extrabold">
                              {sup.active_cumulative_weight.toFixed(2)} Qtl
                            </td>
                            <td className="py-3 px-4 text-slate-400 truncate max-w-[150px]" title={varietiesList}>
                              {varietiesList}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => {
                                  setSelectedSupplierId(sup.id);
                                  onToggleCompareMode(false);
                                }}
                                className="px-2.5 py-1 bg-[#1e293b] hover:bg-indigo-600 hover:text-white text-indigo-300 rounded-lg text-[10px] font-bold transition-all min-h-[28px]"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* DETAIL PANEL & ANALYTICS */}
        {!isCompareMode && (
          <div className="lg:col-span-8 space-y-6 animate-fade-in">
            {detailLoading ? (
              <div className="glass p-12 rounded-3xl text-center text-slate-400 flex flex-col items-center justify-center min-h-[400px]">
                <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mb-3" />
                <p className="text-sm font-medium">Fetching supplier profile details...</p>
              </div>
            ) : supplierDetail && yoyReport ? (
              <div className="space-y-6">
                
                {/* Profile Card & Action Toolbar */}
                <div className="glass p-6 rounded-3xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 h-24 w-24 bg-amber-500/5 rounded-full blur-xl"></div>
                  
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-850 pb-5">
                    <div className="space-y-1.5">
                      <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                        {supplierDetail.supplier_id}
                      </span>
                      <h3 className="text-2xl font-extrabold text-white">{supplierDetail.name}</h3>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 text-xs text-slate-400">
                        <span className="flex items-center">
                          <Phone className="h-3.5 w-3.5 mr-1 text-slate-500" />
                          {supplierDetail.contact_number}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-3.5 w-3.5 mr-1 text-slate-500" />
                          {supplierDetail.location}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          setDeliveryDate(new Date().toISOString().substring(0, 10));
                          setDeliveryVariety('Ranjit');
                          setCustomVariety('');
                          setDeliveryWeight(0);
                          setShowLogModal(true);
                        }}
                        className="inline-flex items-center space-x-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-[#090b10] font-extrabold rounded-xl transition-all text-xs min-h-[38px]"
                      >
                        <Plus className="h-4.5 w-4.5" />
                        <span>Log Delivery</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setSupplierName(supplierDetail.name);
                          setSupplierContact(supplierDetail.contact_number);
                          setSupplierLocation(supplierDetail.location);
                          setShowEditModal(true);
                        }}
                        className="inline-flex items-center justify-center p-2 hover:bg-slate-800 rounded-xl border border-slate-700 text-slate-300 transition-colors min-h-[38px] min-w-[38px]"
                        title="Edit Profile Details"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={handleDeleteSupplier}
                        className="inline-flex items-center justify-center p-2 hover:bg-rose-950/20 hover:text-rose-400 rounded-xl border border-slate-800 hover:border-rose-500/30 text-slate-400 transition-colors min-h-[38px] min-w-[38px]"
                        title="Deregister Supplier"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Localized stats summary (Requirement 2.3.2) */}
                  <div className="pt-4 flex items-center justify-between text-xs text-slate-400">
                    <span className="bg-[#1e293b]/50 border border-slate-800/80 px-3.5 py-2 rounded-xl">
                      Active Cycle: <strong className="text-white font-extrabold">{yoyReport.active_year}</strong>
                    </span>
                    <span className="text-slate-300">
                      Supplier Profile: <strong className="text-indigo-400 font-extrabold">{yoyReport.active_deliveries_count} {yoyReport.active_deliveries_count === 1 ? 'Delivery' : 'Deliveries'}</strong>, Cumulative Weight: <strong className="text-amber-400 font-extrabold">{yoyReport.active_cumulative_weight.toFixed(2)} Quintals</strong>
                    </span>
                  </div>
                </div>

                {/* YoY HISTORICAL COMPARISON PANEL (Requirement 2.4) */}
                <div className="glass p-6 rounded-3xl space-y-4">
                  <div>
                    <h4 className="font-extrabold text-white text-base">Year-over-Year Historical Comparison</h4>
                    <p className="text-xs text-slate-400">Chronological summary tracking volume variance parameters (Quantity-Only).</p>
                  </div>

                  {/* Historical Grid Layout Table (Requirement 2.4.2) */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          <th className="pb-3 pr-4">Calendar Year</th>
                          <th className="pb-3 px-4 text-center">Deliveries Processed</th>
                          <th className="pb-3 px-4 text-right">Aggregate Weight (Quintals)</th>
                          <th className="pb-3 pl-4 text-right">Y-o-Y Volume Variance (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {yoyReport.yoy_grid.map((row) => (
                          <tr key={row.year} className="hover:bg-slate-900/10">
                            <td className="py-3.5 pr-4 text-white font-extrabold">
                              {row.year} {row.year === yoyReport.active_year && <span className="text-[10px] text-amber-500 font-medium ml-1.5">(Active)</span>}
                            </td>
                            <td className="py-3.5 px-4 text-center text-slate-300 font-medium">
                              {row.deliveries_count}
                            </td>
                            <td className="py-3.5 px-4 text-right text-slate-200 font-extrabold">
                              {row.aggregate_weight.toFixed(2)}
                            </td>
                            <td className="py-3.5 pl-4 text-right">
                              {row.variance_percentage === null ? (
                                <span className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">Baseline</span>
                              ) : row.variance_percentage > 0 ? (
                                <span className="text-emerald-400 font-extrabold flex items-center justify-end">
                                  +{row.variance_percentage.toFixed(1)}% ▲
                                </span>
                              ) : row.variance_percentage < 0 ? (
                                <span className="text-rose-400 font-extrabold flex items-center justify-end">
                                  {row.variance_percentage.toFixed(1)}% ▼
                                </span>
                              ) : (
                                <span className="text-slate-400 font-extrabold">0.0%</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mathematical Equation Footer (Requirement 2.4.3) */}
                  <div className="p-3.5 bg-[#0a0e17] border border-slate-850 rounded-2xl flex items-start space-x-3">
                    <Info className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">Trend Analysis Index</span>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Percentage variance evaluates shifts in supply consistency relative to the immediate previous cycle:
                      </p>
                      {/* LaTeX Formula Math Block Render */}
                      <div className="pt-2 pb-1 overflow-x-auto flex justify-center bg-[#07090f] p-2 rounded-lg border border-slate-900">
                        <span className="text-indigo-300 text-xs font-mono select-none">
                          Supply Variance % = [ (Current Year Weight - Prior Year Weight) / Prior Year Weight ] × 100
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEASONAL QUANTITY DELIVERY LOGS MATRIX */}
                <div className="glass p-6 rounded-3xl space-y-4">
                  <h4 className="font-extrabold text-white text-base">Seasonal Delivery Logs</h4>
                  
                  {supplierDetail.deliveries.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                      No crop deliveries recorded for this supplier. Click "Log Delivery" to register quantities.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            <th className="pb-3 pr-4">Delivery Date</th>
                            <th className="pb-3 px-4">Paddy Variety/Classification</th>
                            <th className="pb-3 px-4 text-right">Net Payload Weight</th>
                            <th className="pb-3 pl-4 text-right w-16">Void</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {/* Sort deliveries in descending order of date */}
                          {[...supplierDetail.deliveries]
                            .sort((a, b) => new Date(b.delivery_date).getTime() - new Date(a.delivery_date).getTime())
                            .map((del) => (
                              <tr key={del.id} className="hover:bg-slate-900/10">
                                <td className="py-3 pr-4 text-slate-305 font-medium">
                                  <span className="flex items-center">
                                    <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                                    {del.delivery_date}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-white font-extrabold">
                                  {del.variety}
                                </td>
                                <td className="py-3 px-4 text-right text-slate-200 font-extrabold">
                                  {del.weight.toFixed(2)} Quintals
                                </td>
                                <td className="py-3 pl-4 text-right">
                                  <button
                                    onClick={() => handleDeleteDelivery(del.id, del.weight, del.variety)}
                                    className="p-1.5 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                                    title="Void Delivery Record"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="glass p-12 rounded-3xl text-center text-slate-500 flex flex-col items-center justify-center min-h-[400px]">
                <Wheat className="h-12 w-12 text-slate-600 mb-3 animate-pulse" />
                <h3 className="font-extrabold text-white text-lg mb-1">No Supplier Selected</h3>
                <p className="text-xs max-w-sm leading-normal">
                  Select a profile from the registry directory or register a new paddy supplier to view volume reports.
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* --- MODAL DIALOGS FOR PROCUREMENT MANAGEMENT --- */}

      {/* 1. Register Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#0d121f] border border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
              <Wheat className="h-5 w-5 text-indigo-400" />
              Register Paddy Supplier
            </h3>
            <p className="text-xs text-slate-400 mb-5">Create a persistent registry profile for farmers/suppliers.</p>
            
            <form onSubmit={handleRegisterSupplier} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Haran Borah"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full bg-[#111827] text-slate-100 rounded-xl px-3 py-2.5 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Primary Contact Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={supplierContact}
                  onChange={(e) => setSupplierContact(e.target.value)}
                  className="w-full bg-[#111827] text-slate-100 rounded-xl px-3 py-2.5 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Village / Regional Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kharupetia"
                  value={supplierLocation}
                  onChange={(e) => setSupplierLocation(e.target.value)}
                  className="w-full bg-[#111827] text-slate-100 rounded-xl px-3 py-2.5 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs min-h-[40px] shadow-lg shadow-indigo-600/15"
                >
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Supplier Modal */}
      {showEditModal && supplierDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#0d121f] border border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-indigo-400" />
              Update Supplier Profile
            </h3>
            <p className="text-xs text-slate-400 mb-5">Modify registry parameters for {supplierDetail.supplier_id}.</p>
            
            <form onSubmit={handleUpdateSupplier} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Haran Borah"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full bg-[#111827] text-slate-100 rounded-xl px-3 py-2.5 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Primary Contact Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={supplierContact}
                  onChange={(e) => setSupplierContact(e.target.value)}
                  className="w-full bg-[#111827] text-slate-100 rounded-xl px-3 py-2.5 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Village / Regional Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kharupetia"
                  value={supplierLocation}
                  onChange={(e) => setSupplierLocation(e.target.value)}
                  className="w-full bg-[#111827] text-slate-100 rounded-xl px-3 py-2.5 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs min-h-[40px]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Log Delivery Modal */}
      {showLogModal && supplierDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#0d121f] border border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setShowLogModal(false)}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
              <Scale className="h-5 w-5 text-amber-500" />
              Quick Log Crop Delivery
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Record a seasonal paddy payload weight for <strong className="text-white font-semibold">{supplierDetail.name}</strong>.
            </p>
            
            <form onSubmit={handleLogDelivery} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Delivery Date</label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-[#111827] text-slate-100 rounded-xl px-3 py-2.5 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Paddy Variety/Classification</label>
                
                <div className="flex flex-wrap gap-2 mb-2">
                  {['Ranjit', 'Goya', 'Mota', 'Custom'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDeliveryVariety(v)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        deliveryVariety === v
                          ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500'
                          : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'
                      } min-h-[34px]`}
                    >
                      {v}
                    </button>
                  ))}
                </div>

                {deliveryVariety === 'Custom' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter custom variety (e.g. Joha, Aijung)"
                    value={customVariety}
                    onChange={(e) => setCustomVariety(e.target.value)}
                    className="w-full bg-[#111827] text-slate-100 rounded-xl px-3 py-2.5 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] mt-1"
                  />
                )}
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">
                  Net Payload Weight (Quintals)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 145.50"
                    value={deliveryWeight || ''}
                    onChange={(e) => setDeliveryWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#111827] text-slate-100 rounded-xl px-3 py-2.5 pr-12 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                  />
                  <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500 font-bold text-xs">
                    Qtl
                  </span>
                </div>
                <span className="block text-[9px] text-slate-500 mt-1 leading-normal">
                  Note: Unit weight is logged in standard industrial Quintals (1 Quintal = 100 kg). No pricing variables are collected.
                </span>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-[#090b10] font-extrabold rounded-xl text-xs min-h-[40px] shadow-lg shadow-amber-500/15"
                >
                  Save Entry log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
