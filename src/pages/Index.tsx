import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, BookOpen, Upload, Users, Clock, Star, FileText, Search, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Index() {
  const { user } = useAuth();
  const { isCurrentThemeDark, currentTheme, availableThemes } = useTheme();

  // Get actual theme colors rather than CSS variables for reliable rendering
  const themeColors = availableThemes[currentTheme].colors;
  
  // Safely access border color with a fallback
  const getBorderColor = () => {
    return 'border' in themeColors ? themeColors.border : themeColors.primary;
  };
  
  const borderColor = getBorderColor();

  return (
    <div className={`min-h-screen ${isCurrentThemeDark ? 'bg-black' : 'bg-white'}`}>
      {/* Main Hero Section with Big Logo */}
      <section className="relative h-[80vh] overflow-hidden">
        {/* Background patterns - theme compatible */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute w-full h-full" style={{ backgroundColor: themeColors.background }} />
          <div className="absolute top-0 right-0 w-1/3 h-1/3 rounded-bl-full" 
            style={{ backgroundColor: themeColors.primary, opacity: 0.1 }} />
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 rounded-tr-full" 
            style={{ backgroundColor: themeColors.accent, opacity: 0.1 }} />
          <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full opacity-20" 
            style={{ borderColor: borderColor, borderWidth: '1px' }} />
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full opacity-20" 
            style={{ borderColor: borderColor, borderWidth: '1px' }} />
        </div>
        
        <div className="container mx-auto h-full px-4 flex flex-col items-center justify-center">
          {/* Static Stash Logo - Large and Prominent */}
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 p-2 rounded-xl shadow-lg" style={{ backgroundColor: themeColors.card }}>
              <Package size={80} className="text-primary" style={{ color: themeColors.primary }} />
            </div>
            <h1 className="text-7xl sm:text-8xl font-extrabold font-mono tracking-tighter" style={{ color: themeColors.text }}>
              stash
            </h1>
          </div>
          
          {/* Tagline */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <p 
              className="text-xl md:text-2xl text-center mb-8 max-w-2xl opacity-80"
              style={{ color: themeColors.text }}
            >
              Your personal knowledge hub for sharing and discovering study materials
            </p>
          </motion.div>
          
          {/* Call-to-action buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 mt-4"
          >
            <Button asChild size="lg" className="hover:opacity-90 text-white px-8" style={{ backgroundColor: themeColors.primary }}>
              <Link to={user ? "/notes" : "/auth"}>
                {user ? "My Dashboard" : "Get Started"} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" 
              className="hover:bg-primary/10" 
              style={{ 
                borderColor: themeColors.accent || themeColors.primary, 
                color: themeColors.text,
                backgroundColor: isCurrentThemeDark ? '#1A1A1A' : '#FFFFFF' 
              }}
            >
              <Link to="/notes">Browse Notes</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid - Apple-inspired design */}
      <section className="py-20 px-4" style={{ backgroundColor: isCurrentThemeDark ? '#111' : '#f9f9f9' }}>
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            {featuresData.map((feature, index) => (
              <FeatureCard 
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                cta={feature.cta}
                link={feature.link === "/favorites" && user ? "/notes" : feature.link}
                delay={0.1 + index * 0.1}
                themeColors={themeColors}
                borderColor={borderColor}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer Banner */}
      <section className="py-16" style={{ backgroundColor: themeColors.card }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4" style={{ color: themeColors.text }}>
            Ready to enhance your study experience?
          </h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto opacity-80" style={{ color: themeColors.text }}>
            Join the community of students sharing and collaborating on academic materials.
          </p>
          <Button asChild size="lg" className="hover:opacity-90 text-white px-8" style={{ backgroundColor: themeColors.primary }}>
            <Link to={user ? "/upload" : "/auth"}>
              {user ? "Upload Notes" : "Sign Up Now"} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

// Feature Card Component
const FeatureCard = ({ icon, title, description, cta, link, delay, themeColors, borderColor }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
  >
    <Card 
      className="overflow-hidden h-full hover:shadow-lg transition-all duration-300" 
      style={{ 
        backgroundColor: themeColors.card, 
        borderColor: borderColor
      }}
    >
      <CardContent className="p-6">
        <div 
          className="p-3 rounded-full w-fit mb-4" 
          style={{ 
            backgroundColor: `${themeColors.primary}20`
          }}
        >
          <div className="text-primary" style={{ color: themeColors.primary }}>
            {icon}
          </div>
        </div>
        
        <h3 className="text-xl font-semibold mb-2" style={{ color: themeColors.text }}>{title}</h3>
        <p className="mb-5" style={{ color: themeColors.text, opacity: 0.8 }}>{description}</p>
        
        <Link 
          to={link} 
          className="flex items-center font-medium hover:underline"
          style={{ color: themeColors.primary }}
        >
          {cta} <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  </motion.div>
);

// Features data
const featuresData = [
  {
    icon: <BookOpen className="h-10 w-10" />,
    title: "Study Notes",
    description: "Access a comprehensive library of study materials",
    cta: "Browse Notes",
    link: "/notes"
  },
  {
    icon: <Users className="h-10 w-10" />,
    title: "Class Collaboration",
    description: "Connect and share with your classmates",
    cta: "Join Classes",
    link: "/classes"
  },
  {
    icon: <Upload className="h-10 w-10" />,
    title: "Share Knowledge",
    description: "Upload and organize your study materials",
    cta: "Upload Content",
    link: "/upload"
  },
  {
    icon: <Clock className="h-10 w-10" />,
    title: "Study Efficiency",
    description: "Save time by using organized content",
    cta: "Learn More",
    link: "/notes"
  },
  {
    icon: <Star className="h-10 w-10" />,
    title: "Favorites",
    description: "Bookmark and organize your favorite materials",
    cta: "View Favorites",
    link: "/favorites"
  },
  {
    icon: <Search className="h-10 w-10" />,
    title: "Smart Search",
    description: "Find exactly what you need, when you need it",
    cta: "Try Searching",
    link: "/notes"
  }
];
