
'use client';

import { useState, useMemo } from 'react';
import { useIntegrations } from '@/contexts/integrations-context';
import { AppCard } from '@/components/marketplace/app-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Store, Search } from 'lucide-react';

export default function MarketplacePage() {
  const { integrations } = useIntegrations();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = useMemo(() => {
    const allCategories = new Set(integrations.map(int => int.category));
    return ['All', ...Array.from(allCategories)];
  }, [integrations]);

  const filteredIntegrations = useMemo(() => {
    return integrations.filter(integration => {
      const matchesCategory = selectedCategory === 'All' || integration.category === selectedCategory;
      const matchesSearch = searchTerm === '' || integration.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [integrations, searchTerm, selectedCategory]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-grow">
                <CardTitle className="flex items-center gap-2"><Store /> App Marketplace</CardTitle>
                <CardDescription>Discover and manage extensions to power up your blog.</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search apps..." 
                        className="pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredIntegrations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIntegrations.map(integration => (
              <AppCard key={integration.id} integration={integration} />
            ))}
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
            <h3 className="text-lg font-semibold">No apps found</h3>
            <p>Try adjusting your search or category filter.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
