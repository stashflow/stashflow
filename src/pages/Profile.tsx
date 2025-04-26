import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserReputation } from '@/components/UserReputation';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    username: '',
    full_name: '',
    avatar_url: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user?.id)
          .single();

        if (error) throw error;
        setProfile(data || { username: '', full_name: '', avatar_url: '' });
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadProfile();
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          full_name: profile.full_name,
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="animate-pulse flex items-center justify-center h-screen">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--color-text)' }}>Your Profile</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-2">
              <Card style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <CardHeader>
                  <CardTitle style={{ color: 'var(--color-text)' }}>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback 
                        style={{ 
                          backgroundColor: 'var(--color-primary)',
                          color: 'white'
                        }}
                        className="text-2xl"
                      >
                        {user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                        {profile.full_name || user?.email}
                      </h2>
                      <p className="text-muted-foreground">
                        {profile.username ? `@${profile.username}` : 'No username set'}
                      </p>
                      <p className="text-muted-foreground mt-1">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdate} className="space-y-6">
                    <div>
                      <Label htmlFor="username" style={{ color: 'var(--color-text)' }}>Username</Label>
                      <Input
                        id="username"
                        value={profile.username}
                        onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                        className="mt-2"
                        style={{ 
                          backgroundColor: 'var(--color-background)', 
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text)' 
                        }}
                        placeholder="Enter username"
                      />
                    </div>

                    <div>
                      <Label htmlFor="full_name" style={{ color: 'var(--color-text)' }}>Full Name</Label>
                      <Input
                        id="full_name"
                        value={profile.full_name}
                        onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                        className="mt-2"
                        style={{ 
                          backgroundColor: 'var(--color-background)', 
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text)' 
                        }}
                        placeholder="Enter full name"
                      />
                    </div>

                    <Button
                      type="submit"
                      style={{ 
                        backgroundColor: 'var(--color-primary)', 
                        color: 'white' 
                      }}
                    >
                      Update Profile
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
            
            {/* Reputation Card */}
            <div className="lg:col-span-1">
              {user && <UserReputation userId={user.id} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 