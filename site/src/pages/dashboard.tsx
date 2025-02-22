import React, { useState } from 'react';
import { DashboardLayout } from '@/lib/layouts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Upload, Clock, User, FileText } from 'lucide-react';

export default function Dashboard() {
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    age: '',
    symptoms: '',
    medicalHistory: '',
    currentMedications: '',
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatientInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    const formData = new FormData();
    
    // Add patient info to formData
    Object.entries(patientInfo).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // Add files to formData
    selectedFiles.forEach((file, index) => {
      formData.append(`image${index}`, file);
    });

    // Simulate API endpoint structure
    const apiEndpoint = '/api/analysis/new';
    
    console.log('Simulating API POST to:', apiEndpoint);
    console.log('Data being sent:', {
      patientInfo,
      fileCount: selectedFiles.length,
      fileNames: selectedFiles.map(f => f.name)
    });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    console.log('Analysis saved successfully (simulation)');
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-primary-900">New Analysis</h1>
          <Clock className="text-primary-500 w-6 h-6" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Patient Name</label>
                  <Input
                    name="name"
                    value={patientInfo.name}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="Enter patient name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Age</label>
                  <Input
                    name="age"
                    type="number"
                    value={patientInfo.age}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="Enter age"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Current Symptoms</label>
                <Textarea
                  name="symptoms"
                  value={patientInfo.symptoms}
                  onChange={handleInputChange}
                  className="w-full h-24"
                  placeholder="Describe current symptoms including chest pain, dizziness, shortness of breath, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Medical History</label>
                <Textarea
                  name="medicalHistory"
                  value={patientInfo.medicalHistory}
                  onChange={handleInputChange}
                  className="w-full h-24"
                  placeholder="Enter relevant medical history"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Current Medications</label>
                <Textarea
                  name="currentMedications"
                  value={patientInfo.currentMedications}
                  onChange={handleInputChange}
                  className="w-full"
                  placeholder="List current medications"
                />
              </div>

              <div className="mt-4">
                <div className="bg-background-100 border border-background-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Upload className="h-5 w-5 text-primary-500" />
                    <label className="text-sm font-medium text-primary-900">
                      Upload Medical Images
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                      />
                    </label>
                    {selectedFiles.length > 0 && (
                      <span className="text-sm text-primary-600">
                        {selectedFiles.length} file(s) selected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6"
            >
              {isSubmitting ? 'Saving...' : 'Save Analysis'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}