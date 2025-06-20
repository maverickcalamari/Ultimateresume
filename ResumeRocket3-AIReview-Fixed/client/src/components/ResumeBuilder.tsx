import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Plus, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResumeSection {
  id: string;
  type: string;
  title: string;
  content: string;
  order: number;
}

interface ResumeBuilderProps {
  industry?: string;
  onComplete?: (resume: string) => void;
}

export default function ResumeBuilder({ industry = "technology", onComplete }: ResumeBuilderProps) {
  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    website: ""
  });

  const [sections, setSections] = useState<ResumeSection[]>([
    {
      id: "summary",
      type: "summary",
      title: "Professional Summary",
      content: "",
      order: 1
    },
    {
      id: "experience",
      type: "experience",
      title: "Professional Experience",
      content: "",
      order: 2
    },
    {
      id: "education",
      type: "education",
      title: "Education",
      content: "",
      order: 3
    },
    {
      id: "skills",
      type: "skills",
      title: "Technical Skills",
      content: "",
      order: 4
    }
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState("professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const generateResumeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/resumes/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalInfo,
          sections,
          industry,
          template: selectedTemplate
        }),
      });
      if (!response.ok) throw new Error("Failed to generate resume");
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedResume(data.content);
      setShowPreview(true);
      onComplete?.(data.content);
      toast({
        title: "Resume Generated!",
        description: "Your professional resume has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addSection = () => {
    const newSection: ResumeSection = {
      id: `section_${Date.now()}`,
      type: "custom",
      title: "New Section",
      content: "",
      order: sections.length + 1
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (id: string, field: keyof ResumeSection, value: string | number) => {
    setSections(sections.map(section => 
      section.id === id ? { ...section, [field]: value } : section
    ));
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(section => section.id !== id));
  };

  const downloadResume = () => {
    if (!generatedResume) return;
    
    const blob = new Blob([generatedResume], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${personalInfo.fullName.replace(/\s+/g, '_')}_Resume.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    try {
      const response = await fetch("/api/resumes/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: generatedResume,
          personalInfo,
          template: selectedTemplate
        }),
      });
      
      if (!response.ok) throw new Error("Failed to generate PDF");
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "PDF Export Failed",
        description: "Unable to generate PDF. Please try downloading as text.",
        variant: "destructive",
      });
    }
  };

  if (showPreview && generatedResume) {
    return (
      <Card className="card-professional">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-green-600 bg-clip-text text-transparent">
                  Your Professional Resume
                </CardTitle>
                <p className="text-gray-600 text-sm">ATS-optimized and ready to download</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowPreview(false)} size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button onClick={downloadResume} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Download className="h-4 w-4 mr-2" />
                Download TXT
              </Button>
              <Button onClick={downloadPDF} size="sm" className="bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
              {generatedResume}
            </pre>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-professional">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
              Resume Builder
            </CardTitle>
            <p className="text-gray-600 text-sm">Create a professional resume from scratch</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Choose Template
          </label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="creative">Creative</SelectItem>
              <SelectItem value="executive">Executive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Full Name"
              value={personalInfo.fullName}
              onChange={(e) => setPersonalInfo({...personalInfo, fullName: e.target.value})}
            />
            <Input
              placeholder="Email Address"
              type="email"
              value={personalInfo.email}
              onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
            />
            <Input
              placeholder="Phone Number"
              value={personalInfo.phone}
              onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
            />
            <Input
              placeholder="Location (City, State)"
              value={personalInfo.location}
              onChange={(e) => setPersonalInfo({...personalInfo, location: e.target.value})}
            />
            <Input
              placeholder="LinkedIn Profile"
              value={personalInfo.linkedin}
              onChange={(e) => setPersonalInfo({...personalInfo, linkedin: e.target.value})}
            />
            <Input
              placeholder="Website/Portfolio"
              value={personalInfo.website}
              onChange={(e) => setPersonalInfo({...personalInfo, website: e.target.value})}
            />
          </div>
        </div>

        <Separator />

        {/* Resume Sections */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Resume Sections</h3>
            <Button onClick={addSection} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>

          <div className="space-y-4">
            {sections
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Input
                      value={section.title}
                      onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                      className="font-medium"
                    />
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {section.type}
                      </Badge>
                      {section.type === 'custom' && (
                        <Button
                          onClick={() => removeSection(section.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <Textarea
                    placeholder={`Enter your ${section.title.toLowerCase()} content...`}
                    value={section.content}
                    onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                    className="min-h-24"
                  />
                </div>
              ))}
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={() => {
            setIsGenerating(true);
            generateResumeMutation.mutate();
          }}
          disabled={!personalInfo.fullName || !personalInfo.email || generateResumeMutation.isPending}
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 btn-professional text-base"
        >
          {generateResumeMutation.isPending ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Generating Resume...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Generate Professional Resume</span>
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}