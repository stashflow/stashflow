import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpen, Upload, Users, Star, FileText, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import StashLogoAnimation from '@/components/StashLogoAnimation';

export default function Index() {
  const { user } = useAuth();
  const { isCurrentThemeDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [animateHero, setAnimateHero] = useState(false);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // Trigger hero animation after content loads
    const animationTimer = setTimeout(() => {
      setAnimateHero(true);
    }, 1200);

    return () => {
      clearTimeout(timer);
      clearTimeout(animationTimer);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <StashLogoAnimation isActive={true} size="lg" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${isCurrentThemeDark ? 'from-black' : 'from-white'} to-[color:var(--color-card)]`}>
      {/* Hero Section */}
      <div className={`relative overflow-hidden py-20 transition-all duration-1000 ease-out ${animateHero ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[color:var(--color-primary)] rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-[color:var(--color-accent)] rounded-full opacity-10 blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
            <div className="mb-8 transform hover:scale-105 transition-transform duration-500">
              <StashLogoAnimation isActive={true} size="lg" />
            </div>
            
            <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[color:var(--color-primary)] to-[color:var(--color-accent)]">
              Welcome to stash
            </h1>
            
            <p className="text-xl text-[color:var(--color-text)] opacity-90 mb-8 max-w-xl">
              Your personal knowledge hub for sharing and discovering study materials with your classmates
            </p>
            
            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <Button 
                  size="lg" 
                  className="bg-[color:var(--color-primary)] hover:bg-[color:var(--color-primary)]/90 text-white w-full sm:w-auto"
                  onClick={() => window.location.href = 'https://stashflow-github-m8iu5a7u8-sickleedges-projects.vercel.app/auth'}
                >
                  Get Started
                </Button>
                <Button asChild size="lg" variant="outline" className="border-[color:var(--color-accent)] text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/10 w-full sm:w-auto">
                  <Link to="/notes">Browse Notes</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center text-[color:var(--color-text)]">
          Everything you need for better studying
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuresData.map((feature, index) => (
            <Card key={index} className="bg-[color:var(--color-card)] border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:translate-y-[-5px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[color:var(--color-primary)]/20 to-transparent rounded-bl-full opacity-50 transition-opacity group-hover:opacity-70"></div>
              <CardHeader>
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[color:var(--color-primary)]/10 mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl text-[color:var(--color-text)]">{feature.title}</CardTitle>
                <CardDescription className="text-[color:var(--color-text)]/95">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className={`w-full ${feature.primary 
                  ? 'bg-[color:var(--color-primary)] hover:bg-[color:var(--color-primary)]/90 text-white' 
                  : 'bg-transparent border border-[color:var(--color-accent)] text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/10'
                }`}>
                  <Link to={feature.link}>
                    {feature.buttonText} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats Section (only show if user is logged in) */}
      {user && (
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="p-8 bg-[color:var(--color-card)] rounded-2xl shadow-lg border border-[color:var(--color-border)]">
            <h2 className="text-2xl sm:text-3xl font-bold mb-10 text-[color:var(--color-text)]">Your Study Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StatCard 
                icon={<FileText className="h-8 w-8 text-[color:var(--color-primary)]" />}
                value="Access"
                label="Latest Notes"
                link="/notes"
              />
              <StatCard 
                icon={<Users className="h-8 w-8 text-[color:var(--color-secondary)]" />}
                value="Join"
                label="Your Classes"
                link="/classes"
              />
              <StatCard 
                icon={<Upload className="h-8 w-8 text-[color:var(--color-accent)]" />}
                value="Share"
                label="Your Knowledge"
                link="/upload"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Features data
const featuresData = [
  {
    icon: <BookOpen className="h-6 w-6 text-[color:var(--color-primary)]" />,
    title: "Browse Notes",
    description: "Access a wide range of study materials shared by peers across various subjects",
    link: "/notes",
    buttonText: "Browse Notes",
    primary: true
  },
  {
    icon: <Upload className="h-6 w-6 text-[color:var(--color-accent)]" />,
    title: "Share Your Notes",
    description: "Contribute to the community by sharing your study materials and knowledge",
    link: "/upload",
    buttonText: "Upload Notes",
    primary: false
  },
  {
    icon: <Users className="h-6 w-6 text-[color:var(--color-secondary)]" />,
    title: "Join Classes",
    description: "Connect with your classmates and share notes within your specific classes",
    link: "/classes",
    buttonText: "View Classes",
    primary: false
  }
];

// Stat Card Component
const StatCard = ({ icon, value, label, link }) => (
  <Link to={link} className="block group">
    <div className="flex flex-col items-center p-6 rounded-xl bg-[color:var(--color-background)]/50 hover:bg-[color:var(--color-background)] transition-all duration-300">
      <div className="mb-3">{icon}</div>
      <div className="text-2xl font-bold text-[color:var(--color-text)]">{value}</div>
      <div className="text-sm text-[color:var(--color-text)]/95">{label}</div>
      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <ArrowRight className="h-5 w-5 text-[color:var(--color-text)]" />
      </div>
    </div>
  </Link>
);
