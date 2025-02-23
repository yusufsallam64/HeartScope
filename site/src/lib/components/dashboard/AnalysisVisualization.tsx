import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Heart, AlertTriangle, CheckCircle, Activity, BarChart3, FileText, ListChecks, ChartPie, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RiskIndicator {
  title: string;
  value: number;
  maxValue: number;
  status: 'low' | 'moderate' | 'high' | 'critical';
}

const RiskIndicatorCard: React.FC<RiskIndicator> = ({ title, value, maxValue, status }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">{title}</span>
        <Badge className={`${getStatusColor(status)} text-white`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>
      <div className="space-y-2">
        <Progress 
          value={(value / maxValue) * 100} 
          className="h-2"
          indicatorClassName={getStatusColor(status)}
        />
        <div className="flex justify-between text-sm text-gray-600">
          <span>{value}</span>
          <span>{maxValue}</span>
        </div>
      </div>
    </div>
  );
};

const TrendChart: React.FC<{ data: any[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
    </LineChart>
  </ResponsiveContainer>
);

const RadarAnalysis: React.FC<{ data: any[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <RadarChart data={data}>
      <PolarGrid />
      <PolarAngleAxis dataKey="subject" />
      <PolarRadiusAxis />
      <Radar name="Analysis" dataKey="value" fill="#82ca9d" fillOpacity={0.6} />
    </RadarChart>
  </ResponsiveContainer>
);

interface AnalysisVisualizationsProps {
  openAIResults: {
    risk_score: number;
    risk_category: "Low" | "Moderate" | "High" | "Critical";
    diagnosis_confidence: number;
    blockage_validation: {
      location: string;
      severity: number;
      confidence: number;
    };
    risk_factors: Array<{
      factor: string;
      impact: number;
    }>;
    recommendations: string[];
  };
}

const AnalysisVisualizations: React.FC<AnalysisVisualizationsProps> = ({ openAIResults }) => {
  const {
    risk_score,
    risk_category,
    diagnosis_confidence,
    blockage_validation,
    risk_factors,
    recommendations
  } = openAIResults;

  // Prepare radar chart data
  const radarData = [
    { subject: 'Risk Score', value: risk_score / 100 },
    { subject: 'Diagnosis Confidence', value: diagnosis_confidence / 100 },
    { subject: 'Blockage Severity', value: blockage_validation.severity / 100 },
    { subject: 'Blockage Confidence', value: blockage_validation.confidence / 100 }
  ];

  // Prepare pie chart data for risk distribution
  const riskDistribution = [
    { name: 'Cardiovascular', value: risk_score },
    { name: 'Lifestyle', value: 100 - risk_score }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <FileText className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="risk-analysis">
            <ChartPie className="w-4 h-4 mr-2" />
            Risk Analysis
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="w-4 h-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <ListChecks className="w-4 h-4 mr-2" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Overall Health Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <RiskIndicatorCard
                    title="Risk Score"
                    value={risk_score}
                    maxValue={100}
                    status={risk_category.toLowerCase() as 'low' | 'moderate' | 'high' | 'critical'}
                  />
                  <RiskIndicatorCard
                    title="Diagnosis Confidence"
                    value={diagnosis_confidence}
                    maxValue={100}
                    status={diagnosis_confidence > 75 ? 'high' : 'moderate'}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Blockage Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Location</span>
                      <Badge variant="outline">{blockage_validation.location}</Badge>
                    </div>
                    <RiskIndicatorCard
                      title="Severity"
                      value={blockage_validation.severity}
                      maxValue={100}
                      status={blockage_validation.severity > 70 ? 'critical' : 
                             blockage_validation.severity > 50 ? 'high' : 
                             blockage_validation.severity > 30 ? 'moderate' : 'low'}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                Risk Factor Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={risk_factors}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="factor" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="impact" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk-analysis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartPie className="w-5 h-5 text-green-500" />
                  Risk Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskDistribution}
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  Comprehensive Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <RadarAnalysis data={radarData} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Risk Factors Breakdown</CardTitle>
              <CardDescription>Detailed analysis of individual risk factors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {risk_factors.map((factor, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{factor.factor}</span>
                      <span className="text-sm text-gray-600">{factor.impact}/10</span>
                    </div>
                    <Progress 
                      value={factor.impact * 10} 
                      className="h-2"
                      indicatorClassName={factor.impact > 7 ? 'bg-red-500' : 
                                       factor.impact > 5 ? 'bg-orange-500' : 
                                       factor.impact > 3 ? 'bg-yellow-500' : 'bg-green-500'}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Score Trend</CardTitle>
              <CardDescription>Historical analysis of risk factors over time</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendChart data={[
                { name: 'Jan', value: 65 },
                { name: 'Feb', value: 59 },
                { name: 'Mar', value: risk_score }
              ]} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Blockage Progression</CardTitle>
                <CardDescription>Tracking arterial blockage changes</CardDescription>
              </CardHeader>
              <CardContent>
                <TrendChart data={[
                  { name: 'Initial', value: 45 },
                  { name: 'Week 1', value: 52 },
                  { name: 'Current', value: blockage_validation.severity }
                ]} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Treatment Response</CardTitle>
                <CardDescription>Effectiveness of current treatment plan</CardDescription>
              </CardHeader>
              <CardContent>
                <TrendChart data={[
                  { name: 'Initial', value: 70 },
                  { name: 'Week 1', value: 65 },
                  { name: 'Current', value: diagnosis_confidence }
                ]} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-emerald-500" />
                Clinical Recommendations
              </CardTitle>
              <CardDescription>Prioritized action items based on analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((recommendation, index) => (
                  <Alert key={index} className="border-l-4 border-emerald-500">
                    <AlertDescription className="text-gray-700">
                      {index + 1}. {recommendation}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>Suggested follow-up actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {risk_category === 'High' || risk_category === 'Critical' ? (
                  <Alert className="border-l-4 border-red-500">
                    <AlertDescription className="text-red-700">
                      Immediate consultation recommended
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-l-4 border-green-500">
                    <AlertDescription className="text-green-700">
                      Schedule regular follow-up
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisVisualizations;