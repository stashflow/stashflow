import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';

export interface FilterOptions {
  search: string;
  class_id: string | null;
  professor: string | null;
  semester: string | null;
  school: string | null;
  file_type: string | null;
  min_rating: number | null;
}

interface NotesFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  activeFilters: FilterOptions;
}

export function NotesFilter({ onFilterChange, activeFilters }: NotesFilterProps) {
  const [searchInput, setSearchInput] = useState(activeFilters.search || '');
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>(activeFilters);
  
  // Load classes for filtering
  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });
  
  // Load unique values for filter options
  const { data: filterOptions } = useQuery({
    queryKey: ['filterOptions'],
    queryFn: async () => {
      // Get unique professors
      const { data: professors } = await supabase
        .from('notes')
        .select('professor')
        .not('professor', 'is', null)
        .order('professor');
      
      // Get unique semesters
      const { data: semesters } = await supabase
        .from('notes')
        .select('semester')
        .not('semester', 'is', null)
        .order('semester');
      
      // Get unique schools
      const { data: schools } = await supabase
        .from('notes')
        .select('school')
        .not('school', 'is', null)
        .order('school');
      
      // Get unique file types
      const { data: fileTypes } = await supabase
        .from('notes')
        .select('file_type')
        .not('file_type', 'is', null);
      
      return {
        professors: professors ? [...new Set(professors.map(p => p.professor))] : [],
        semesters: semesters ? [...new Set(semesters.map(s => s.semester))] : [],
        schools: schools ? [...new Set(schools.map(s => s.school))] : [],
        fileTypes: fileTypes ? [...new Set(fileTypes.map(f => f.file_type))] : []
      };
    }
  });
  
  // Handle search input
  const handleSearch = () => {
    const newFilters = { ...currentFilters, search: searchInput };
    setCurrentFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  // Handle search input on Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Apply filters
  const applyFilters = () => {
    onFilterChange(currentFilters);
    setFilterOpen(false);
  };
  
  // Reset all filters
  const resetFilters = () => {
    const emptyFilters: FilterOptions = {
      search: '',
      class_id: null,
      professor: null,
      semester: null,
      school: null,
      file_type: null,
      min_rating: null
    };
    
    setSearchInput('');
    setCurrentFilters(emptyFilters);
    onFilterChange(emptyFilters);
    setFilterOpen(false);
  };
  
  // Update filter value
  const updateFilter = (key: keyof FilterOptions, value: any) => {
    setCurrentFilters(prev => ({ ...prev, [key]: value }));
  };
  
  // Remove a specific filter
  const removeFilter = (key: keyof FilterOptions) => {
    const newFilters = { ...currentFilters, [key]: null };
    if (key === 'search') {
      newFilters.search = '';
      setSearchInput('');
    }
    setCurrentFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  // Count active filters (excluding search)
  const activeFilterCount = Object.entries(activeFilters).filter(([key, value]) => 
    key !== 'search' && value !== null && value !== ''
  ).length;
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            className="pl-8"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{ backgroundColor: 'var(--color-input)', color: 'var(--color-text)' }}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSearch} style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
            Search
          </Button>
          
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-text)' }}>
              <div className="space-y-4">
                <h4 className="font-medium">Filter Notes</h4>
                
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select 
                    value={currentFilters.class_id || ''} 
                    onValueChange={val => updateFilter('class_id', val || null)}
                  >
                    <SelectTrigger style={{ backgroundColor: 'var(--color-input)', color: 'var(--color-text)' }}>
                      <SelectValue placeholder="Any class" />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-text)' }}>
                      <SelectItem value="">Any class</SelectItem>
                      {classes?.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Professor</Label>
                  <Select 
                    value={currentFilters.professor || ''} 
                    onValueChange={val => updateFilter('professor', val || null)}
                  >
                    <SelectTrigger style={{ backgroundColor: 'var(--color-input)', color: 'var(--color-text)' }}>
                      <SelectValue placeholder="Any professor" />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-text)' }}>
                      <SelectItem value="">Any professor</SelectItem>
                      {filterOptions?.professors.map(prof => (
                        <SelectItem key={prof} value={prof}>{prof}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Select 
                    value={currentFilters.semester || ''} 
                    onValueChange={val => updateFilter('semester', val || null)}
                  >
                    <SelectTrigger style={{ backgroundColor: 'var(--color-input)', color: 'var(--color-text)' }}>
                      <SelectValue placeholder="Any semester" />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-text)' }}>
                      <SelectItem value="">Any semester</SelectItem>
                      {filterOptions?.semesters.map(sem => (
                        <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>School</Label>
                  <Select 
                    value={currentFilters.school || ''} 
                    onValueChange={val => updateFilter('school', val || null)}
                  >
                    <SelectTrigger style={{ backgroundColor: 'var(--color-input)', color: 'var(--color-text)' }}>
                      <SelectValue placeholder="Any school" />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-text)' }}>
                      <SelectItem value="">Any school</SelectItem>
                      {filterOptions?.schools.map(school => (
                        <SelectItem key={school} value={school}>{school}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>File Type</Label>
                  <Select 
                    value={currentFilters.file_type || ''} 
                    onValueChange={val => updateFilter('file_type', val || null)}
                  >
                    <SelectTrigger style={{ backgroundColor: 'var(--color-input)', color: 'var(--color-text)' }}>
                      <SelectValue placeholder="Any file type" />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-text)' }}>
                      <SelectItem value="">Any file type</SelectItem>
                      {filterOptions?.fileTypes.map(type => (
                        <SelectItem key={type} value={type}>{type.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Minimum Rating</Label>
                  <Select 
                    value={currentFilters.min_rating?.toString() || ''} 
                    onValueChange={val => updateFilter('min_rating', val ? parseInt(val) : null)}
                  >
                    <SelectTrigger style={{ backgroundColor: 'var(--color-input)', color: 'var(--color-text)' }}>
                      <SelectValue placeholder="Any rating" />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-text)' }}>
                      <SelectItem value="">Any rating</SelectItem>
                      <SelectItem value="3">3+ stars</SelectItem>
                      <SelectItem value="4">4+ stars</SelectItem>
                      <SelectItem value="5">5 stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={resetFilters} style={{ color: 'var(--color-text)' }}>
                    Reset All
                  </Button>
                  <Button onClick={applyFilters} style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Active filter badges */}
      {(activeFilters.search || activeFilterCount > 0) && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: {activeFilters.search}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('search')} />
            </Badge>
          )}
          
          {activeFilters.class_id && classes && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Class: {classes.find(c => c.id === activeFilters.class_id)?.name}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('class_id')} />
            </Badge>
          )}
          
          {activeFilters.professor && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Professor: {activeFilters.professor}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('professor')} />
            </Badge>
          )}
          
          {activeFilters.semester && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Semester: {activeFilters.semester}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('semester')} />
            </Badge>
          )}
          
          {activeFilters.school && (
            <Badge variant="secondary" className="flex items-center gap-1">
              School: {activeFilters.school}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('school')} />
            </Badge>
          )}
          
          {activeFilters.file_type && (
            <Badge variant="secondary" className="flex items-center gap-1">
              File Type: {activeFilters.file_type.toUpperCase()}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('file_type')} />
            </Badge>
          )}
          
          {activeFilters.min_rating && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Rating: {activeFilters.min_rating}+ Stars
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('min_rating')} />
            </Badge>
          )}
          
          {(activeFilters.search || activeFilterCount > 0) && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-6 px-2">
              Clear All
            </Button>
          )}
        </div>
      )}
    </div>
  );
} 