import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Crown, TrendingUp, Calendar, FileText, Award, Target } from "lucide-react";
import SkillAssessment from "./SkillAssessment";
import PremiumModal from "./PremiumModal";

interface DashboardSidebarProps {
  stats?: {
    resumesAnalyzed: number;
    avgScore: number;
    interviews: number;
  };
  resumes?: Array<{
    id: number;
    filename: string;
    createdAt: string;
  }>;
}

export default function DashboardSidebar({ stats, resumes }: DashboardSidebarProps) {
  const [showSkillAssessment, setShowSkillAssessment] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const mockSkills = [
    { name: 'JavaScript', level: 90, color: 'bg-green-600' },
    { name: 'React', level: 85, color: 'bg-green-600' },
    { name: 'Node.js', level: 60, color: 'bg-yellow-600' },
    { name: 'AWS', level: 30, color: 'bg-red-600' },
  ];

  const mockActivities = [
    { 
      id: 1, 
      description: 'Resume analyzed for Technology industry', 
      time: '2 hours ago',
      type: 'success',
      icon: <FileText className="h-4 w-4" />
    },
    { 
      id: 2, 
      description: 'Skills assessment completed', 
      time: '1 day ago',
      type: 'info',
      icon: <Award className="h-4 w-4" />
    },
    { 
      id: 3, 
      description: 'Interview tips generated for Software Engineer role', 
      time: '3 days ago',
      type: 'warning',
      icon: <Target className="h-4 w-4" />
    },
    { 
      id: 4, 
      description: 'Resume template downloaded', 
      time: '5 days ago',
      type: 'success',
      icon: <FileText className="h-4 w-4" />
    },
    { 
      id: 5, 
      description: 'ATS score improved to 85%', 
      time: '1 week ago',
      type: 'success',
      icon: <TrendingUp className="h-4 w-4" />
    },
  ];

  const handleSkillsImprovement = () => {
    setShowSkillAssessment(true);
  };

  const handlePremiumUpgrade = () => {
    setShowPremiumModal(true);
  };

  if (showSkillAssessment) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <SkillAssessment onComplete={() => setShowSkillAssessment(false)} />
        <Button 
          variant="outline" 
          onClick={() => setShowSkillAssessment(false)}
          className="w-full"
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Quick Stats */}
      {stats && (
        <Card className="transition-all duration-300">
          <CardContent className="p-4 sm:p-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 mb-1">Resumes Analyzed</p>
              <p className="text-lg font-semibold">{stats.resumesAnalyzed}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Avg. Score</p>
              <p className="text-lg font-semibold">{stats.avgScore}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Interviews</p>
              <p className="text-lg font-semibold">{stats.interviews}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Premium Upgrade CTA */}
      <Card className="card-professional transition-all duration-300 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
        <CardContent className="p-4 sm:p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-base sm:text-lg">Upgrade to Premium</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              Unlock unlimited analyses, advanced templates, and personal career coaching
            </p>
            <Button 
              onClick={handlePremiumUpgrade}
              className="w-full btn-professional bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-sm sm:text-base"
            >
              <Crown className="h-4 w-4 mr-2" />
              Get Premium
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Industry Targeting */}
      <Card className="card-professional transition-all duration-300">
        <CardContent className="p-4 sm:p-6">
          <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-center text-base sm:text-lg">Target Industry</h3>
          <div className="space-y-3 sm:space-y-4">
            <Select defaultValue="technology">
              <SelectTrigger className="w-full h-10 sm:h-12 text-sm sm:text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="education">Education</SelectItem>
              </SelectContent>
            </Select>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs sm:text-sm text-blue-800 text-center">
                AI recommendations are tailored to your selected industry for maximum impact.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Gap Analysis */}
      <Card className="card-professional transition-all duration-300">
        <CardContent className="p-4 sm:p-6">
          <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-center text-base sm:text-lg">Skills Assessment</h3>
          <div className="space-y-3 sm:space-y-4">
            {mockSkills.map((skill) => (
              <div key={skill.name} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">{skill.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {skill.level}%
                  </Badge>
                </div>
                <Progress value={skill.level} className="h-2" />
              </div>
            ))}
          </div>
          <Button 
            onClick={handleSkillsImprovement}
            className="w-full mt-3 sm:mt-4 btn-professional bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm sm:text-base"
          >
            <Award className="h-4 w-4 mr-2" />
            Take Skills Assessment
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="card-professional transition-all duration-300">
        <CardContent className="p-4 sm:p-6">
          <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-center text-base sm:text-lg">Recent Activity</h3>
          <div className="space-y-3 sm:space-y-4 max-h-64 overflow-y-auto">
            {mockActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  activity.type === 'success' ? 'bg-green-100 text-green-600' : 
                  activity.type === 'info' ? 'bg-blue-100 text-blue-600' : 
                  activity.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 leading-tight">{activity.description}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" className="text-xs">
              View All Activity
            </Button>
          </div>
        </CardContent>
      </Card>

      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)} 
      />
      {/* Remove premium CTAs and feature lists */}
    </div>
  );
}
