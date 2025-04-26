import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({
    username: '',
    full_name: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setProfile({
            username: data.username || '',
            full_name: data.full_name || '',
            avatar_url: data.avatar_url || '',
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
      }
    };

    loadProfile();
  }, [user, navigate, toast]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast({
        title: "Success!",
        description: "Avatar updated successfully",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          username: profile.username,
          full_name: profile.full_name,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Settings</h1>
          
          <Tabs 
            defaultValue="profile" 
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-2 mb-8" style={{ backgroundColor: 'var(--color-card)' }}>
              <TabsTrigger 
                value="profile" 
                style={{ color: 'var(--color-text)' }}
              >
                Profile
              </TabsTrigger>
              <TabsTrigger 
                value="appearance" 
                style={{ color: 'var(--color-text)' }}
              >
                Appearance
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="rounded-lg p-8" style={{ 
              backgroundColor: 'var(--color-card)', 
              borderColor: 'var(--color-text)' 
            }}>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center mb-8">
                  <Avatar className="w-24 h-24 mb-4">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text)' }}>
                      {profile.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    id="avatar"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('avatar')?.click()}
                    className="button-outline"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    Change Avatar
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username" style={{ color: 'var(--color-text)' }}>Username</Label>
                    <Input
                      id="username"
                      value={profile.username}
                      onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                      style={{ 
                        backgroundColor: 'var(--color-background)', 
                        borderColor: 'var(--color-border)', 
                        color: 'var(--color-text)' 
                      }}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="full_name" style={{ color: 'var(--color-text)' }}>Full Name</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name}
                      onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                      style={{ 
                        backgroundColor: 'var(--color-background)', 
                        borderColor: 'var(--color-border)', 
                        color: 'var(--color-text)' 
                      }}
                      className="mt-2"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full button"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="appearance" className="rounded-lg p-8" style={{ 
              backgroundColor: 'var(--color-card)', 
              borderColor: 'var(--color-border)' 
            }}>
              <ThemeSwitcher />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings; 