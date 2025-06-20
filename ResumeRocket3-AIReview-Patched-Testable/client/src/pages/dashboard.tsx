import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import FileUpload from "@/components/FileUpload";
import AnalysisResults from "@/components/AnalysisResults";
import ResumeEditor from "@/components/ResumeEditor";
import DashboardSidebar from "@/components/DashboardSidebar";
import TemplateGenerator from "@/components/TemplateGenerator";
import ResumeBuilder from "@/components/ResumeBuilder";
import PremiumModal from "@/components/PremiumModal";
import AuthModal from "@/components/AuthModal";
import AdminDashboard from "@/components/AdminDashboard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload, Wand2, Crown, User, LogOut, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth, apiRequest } from "@/lib/auth";
import pierlineLogoPath from "@assets/Black and Grey Clean Modern Minimalist Creative Technology Logo_1749417486921.png";

interface Resume {
  id: number;
  filename: string;
  atsScore: number;
  analysis: any;
  suggestions: any[];
  skillsGap: any[];
  originalContent: string;
  industry: string;
}

export default function Dashboard() {
  const [currentResume, setCurrentResume] = useState<Resume | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const { user, isAuthenticated, logout } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/stats');
      return response.json();
    },
  });

  const { data: resumes } = useQuery({
    queryKey: ['/api/resumes'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const response = await apiRequest('GET', '/api/resumes', undefined, true);
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const handleResumeUploaded = (resume: Resume) => {
    setCurrentResume(resume);
    setActiveTab("analysis");
  };

  const handlePremiumClick = () => {
    setShowPremiumModal(true);
  };

  const handleAuthClick = () => {
    setShowAuthModal(true);
  };

  const handleLogout = () => {
    logout();
    setCurrentResume(null);
    setActiveTab("upload");
  };

  // Show admin dashboard if user is admin
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation Header */}
      <nav className="gradient-hero shadow-lg border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <img 
                  src={pierlineLogoPath} 
                  alt="Pierline Consultation" 
                  className="h-10 w-10 sm:h-16 sm:w-16 object-contain filter brightness-0 invert"
                />
                <div className="flex flex-col">
                  <span className="text-lg sm:text-2xl font-bold text-white">Pierline Consultation</span>
                  <span className="text-xs sm:text-sm text-white/80 font-medium">Resume Optimization Services</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <div className="hidden md:flex items-center space-x-4">
                    <span className="text-white/90 text-sm">
                      Welcome, {user?.firstName || user?.username}!
                    </span>
                    <Button 
                      onClick={handlePremiumClick}
                      size="sm" 
                      className="bg-white text-primary hover:bg-white/90 btn-professional font-semibold"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Get Premium
                    </Button>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 hover:text-white">
                        <User className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button 
                    onClick={handleAuthClick}
                    variant="ghost" 
                    size="sm" 
                    className="text-white hover:bg-white/20 hover:text-white"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={handlePremiumClick}
                    size="sm" 
                    className="bg-white text-primary hover:bg-white/90 btn-professional font-semibold"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Premium
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8 sm:mb-12">
          <div className="text-center max-w-4xl mx-auto px-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4 sm:mb-6">
              AI-Powered Resume Optimization
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed mb-6 sm:mb-8 px-4">
              Transform your career prospects with our advanced AI technology. Get instant ATS compatibility analysis, 
              industry-specific optimization suggestions, and professional formatting recommendations.
            </p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>ATS Optimized</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Industry Specific</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>AI Powered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="upload" className="flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Upload & Analyze</span>
                  <span className="sm:hidden">Upload</span>
                </TabsTrigger>
                <TabsTrigger value="build" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Build Resume</span>
                  <span className="sm:hidden">Build</span>
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex items-center space-x-2">
                  <Wand2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Templates</span>
                  <span className="sm:hidden">Templates</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-6">
                <FileUpload onResumeUploaded={handleResumeUploaded} />
                
                {currentResume && (
                  <AnalysisResults 
                    resume={currentResume}
                    onEdit={() => setShowEditor(true)}
                  />
                )}
                
                {showEditor && currentResume && (
                  <ResumeEditor 
                    resume={currentResume}
                    onUpdate={setCurrentResume}
                  />
                )}
              </TabsContent>

              <TabsContent value="build" className="space-y-6">
                <ResumeBuilder />
              </TabsContent>

              <TabsContent value="templates" className="space-y-6">
                <TemplateGenerator />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Dashboard & Stats */}
          <div className="xl:col-span-1">
            <DashboardSidebar stats={stats} resumes={resumes} />
          </div>
        </div>
      </div>

      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)} 
      />

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
}