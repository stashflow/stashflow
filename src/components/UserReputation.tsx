import { useState, useEffect } from 'react';
import { Badge, Star, Award, BookOpen, ThumbsUp, MessageSquare, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UserReputationProps {
  userId: string;
}

interface UserReputationData {
  id: string;
  user_id: string;
  total_points: number;
  uploads_count: number;
  ratings_count: number;
  comments_count: number;
  received_likes_count: number;
  level: number;
  total_badges: number;
  gold_badges: number;
  silver_badges: number;
  bronze_badges: number;
}

interface UserBadge {
  id: string;
  user_id: string;
  badge_type: string;
  badge_name: string;
  badge_description: string;
  awarded_at: string;
}

export function UserReputation({ userId }: UserReputationProps) {
  const [reputationData, setReputationData] = useState<UserReputationData | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserReputation = async () => {
      try {
        setIsLoading(true);
        
        // Fetch reputation data
        const { data: repData, error: repError } = await supabase
          .from('user_reputation_with_badges')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (repError && repError.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" code, which is expected if user has no reputation yet
          console.error('Error fetching reputation:', repError);
        } else if (repData) {
          setReputationData(repData);
        }
        
        // Fetch user badges
        const { data: badgeData, error: badgeError } = await supabase
          .from('user_badges')
          .select('*')
          .eq('user_id', userId)
          .order('awarded_at', { ascending: false });
          
        if (badgeError) {
          console.error('Error fetching badges:', badgeError);
        } else if (badgeData) {
          setBadges(badgeData);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userId) {
      fetchUserReputation();
    }
  }, [userId]);
  
  const getProgressToNextLevel = () => {
    if (!reputationData) return 0;
    
    const currentLevelThreshold = Math.pow(reputationData.level - 1, 2) * 100;
    const nextLevelThreshold = Math.pow(reputationData.level, 2) * 100;
    const pointsForNextLevel = nextLevelThreshold - currentLevelThreshold;
    const progress = (reputationData.total_points - currentLevelThreshold) / pointsForNextLevel * 100;
    
    return Math.min(Math.max(progress, 0), 100);
  };
  
  const getBadgeIcon = (type: string) => {
    if (type.includes('uploads')) return <BookOpen className="h-4 w-4" />;
    if (type.includes('comments')) return <MessageSquare className="h-4 w-4" />;
    if (type.includes('ratings')) return <Star className="h-4 w-4" />;
    if (type.includes('likes')) return <ThumbsUp className="h-4 w-4" />;
    if (type.includes('level')) return <TrendingUp className="h-4 w-4" />;
    return <Award className="h-4 w-4" />;
  };

  const getBadgeColorClass = (type: string) => {
    if (type.includes('gold')) return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
    if (type.includes('silver')) return "bg-slate-400/20 text-slate-400 border-slate-400/50";
    if (type.includes('bronze')) return "bg-amber-600/20 text-amber-600 border-amber-600/50";
    return "bg-blue-500/20 text-blue-500 border-blue-500/50";
  };
  
  if (isLoading) {
    return <ReputationSkeleton />;
  }
  
  if (!reputationData && badges.length === 0) {
    return (
      <Card className="bg-card/30 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Badge className="h-5 w-5" />
            Reputation
          </CardTitle>
          <CardDescription>
            Earn points by uploading notes, rating, and interacting with the community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <p>No reputation data yet</p>
            <p className="text-sm mt-2">Start participating to earn points and badges!</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-card/30 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Badge className="h-5 w-5" />
          Reputation
        </CardTitle>
        <CardDescription>
          Your activity in the StashFlow community
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {reputationData && (
          <>
            {/* Level information */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Level {reputationData.level}</p>
                    <p className="text-xs text-muted-foreground">
                      {reputationData.total_points} total points
                    </p>
                  </div>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          <div className="h-4 w-4 text-yellow-500 flex items-center justify-center">
                            <Award className="h-3 w-3 fill-current" />
                            <span className="ml-1 text-xs">{reputationData.gold_badges || 0}</span>
                          </div>
                          <div className="h-4 w-4 text-slate-400 flex items-center justify-center ml-2">
                            <Award className="h-3 w-3 fill-current" />
                            <span className="ml-1 text-xs">{reputationData.silver_badges || 0}</span>
                          </div>
                          <div className="h-4 w-4 text-amber-600 flex items-center justify-center ml-2">
                            <Award className="h-3 w-3 fill-current" />
                            <span className="ml-1 text-xs">{reputationData.bronze_badges || 0}</span>
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Gold, Silver and Bronze badges</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress to Level {reputationData.level + 1}</span>
                  <span>{Math.round(getProgressToNextLevel())}%</span>
                </div>
                <Progress value={getProgressToNextLevel()} className="h-2" />
              </div>
            </div>
            
            {/* Activity stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-md bg-card/50 border border-border/50">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{reputationData.uploads_count}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Notes uploaded</p>
              </div>
              
              <div className="p-3 rounded-md bg-card/50 border border-border/50">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">{reputationData.ratings_count}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Ratings given</p>
              </div>
              
              <div className="p-3 rounded-md bg-card/50 border border-border/50">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">{reputationData.comments_count}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Comments posted</p>
              </div>
              
              <div className="p-3 rounded-md bg-card/50 border border-border/50">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-pink-500" />
                  <span className="text-sm font-medium">{reputationData.received_likes_count}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Likes received</p>
              </div>
            </div>
          </>
        )}
        
        {/* Badges section */}
        {badges.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" /> Badges earned
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {badges.slice(0, 6).map((badge) => (
                <div 
                  key={badge.id}
                  className={`p-2 rounded-md border text-xs flex items-center gap-2 ${getBadgeColorClass(badge.badge_type)}`}
                >
                  {getBadgeIcon(badge.badge_type)}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="text-left">
                        <div>
                          <p className="font-medium">{badge.badge_name}</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{badge.badge_description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))}
            </div>
            {badges.length > 6 && (
              <p className="text-xs text-muted-foreground text-center">
                +{badges.length - 6} more badges
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReputationSkeleton() {
  return (
    <Card className="bg-card/30 border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div>
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-3 w-24 mt-1" />
              </div>
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-1 mt-3">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="p-3 rounded-md bg-card/50 border border-border/50">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-3 w-20 mt-2" />
            </div>
          ))}
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 