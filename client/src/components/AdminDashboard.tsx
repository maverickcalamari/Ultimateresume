import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, FileText, TrendingUp, Activity, Eye, Download, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");

  const { data: analytics } = useQuery({
    queryKey: ['/api/admin/analytics'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/analytics', undefined, true);
      return response.json();
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users', undefined, true);
      return response.json();
    },
  });

  const { data: resumesData } = useQuery({
    queryKey: ['/api/admin/resumes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/resumes', undefined, true);
      return response.json();
    },
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['/api/admin/audit-logs'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/audit-logs', undefined, true);
      return response.json();
    },
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'login': return 'bg-green-100 text-green-800';
      case 'register': return 'bg-blue-100 text-blue-800';
      case 'upload_resume': return 'bg-purple-100 text-purple-800';
      case 'optimize_resume': return 'bg-orange-100 text-orange-800';
      case 'delete_resume': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Monitor platform activity and manage users</p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="resumes">Resumes</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="card-professional">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{analytics?.recentUsers || 0} this month
                  </p>
                </CardContent>
              </Card>

              <Card className="card-professional">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.totalResumes || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{analytics?.recentResumes || 0} this month
                  </p>
                </CardContent>
              </Card>

              <Card className="card-professional">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg ATS Score</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.averageAtsScore || 0}%</div>
                  <p className="text-xs text-muted-foreground">
                    Platform average
                  </p>
                </CardContent>
              </Card>

              <Card className="card-professional">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.recentUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Last 30 days
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity Summary */}
            <Card className="card-professional">
              <CardHeader>
                <CardTitle>Platform Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Recent Activity</h4>
                      <ul className="space-y-2 text-sm">
                        <li>• {analytics?.recentResumes || 0} resumes uploaded this month</li>
                        <li>• {analytics?.recentUsers || 0} new users registered</li>
                        <li>• {analytics?.averageAtsScore || 0}% average ATS score</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">System Health</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          API Status: Operational
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Database: Connected
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          AI Service: Active
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="card-professional">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.users?.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.firstName} {user.lastName}</div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resumes" className="space-y-6">
            <Card className="card-professional">
              <CardHeader>
                <CardTitle>Resume Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filename</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>ATS Score</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumesData?.resumes?.map((resume: any) => (
                      <TableRow key={resume.id}>
                        <TableCell>
                          <div className="font-medium">{resume.filename}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{resume.industry}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className={`font-medium ${
                              resume.atsScore >= 80 ? 'text-green-600' :
                              resume.atsScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {resume.atsScore || 'N/A'}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(resume.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="card-professional">
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs?.logs?.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge className={getActionBadgeColor(log.action)}>
                            {log.action.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>User #{log.userId}</TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {JSON.stringify(log.details)}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                        <TableCell>{formatDate(log.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}