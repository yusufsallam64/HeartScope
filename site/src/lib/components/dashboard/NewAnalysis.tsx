import { useState, ChangeEvent, FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Upload, Clock, User, X, Maximize2, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PatientInfo {
  name: string;
  age: string;
  symptoms: string;
  medicalHistory: string;
  currentMedications: string;
}

interface FormErrors {
  name?: string;
  age?: string;
  files?: string;
  medicalRecords?: string;
  [key: string]: string | undefined;
}

interface ImagePreview {
  url: string;
  file: File;
  name: string;
}

interface PDFFile {
  file: File;
  name: string;
  size: string;
}
interface AnalysisResult {
  filename: string;
  annotations: any[]; // Replace with proper type based on your FastAPI response
  visualization_path: string | null;
}

interface ApiResponse {
  message: string;
  analysisId?: string;
  results?: AnalysisResult[];
}

const MAX_FILE_SIZE = 1024 * 1024; // 1MB in bytes
const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_PDF_TYPE = 'application/pdf';

interface NewAnalysisProps {
  onSuccess?: () => void;
}

const NewAnalysis: React.FC<NewAnalysisProps> = ({ onSuccess }) => {
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: '',
    age: '',
    symptoms: '',
    medicalHistory: '',
    currentMedications: '',
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPDF, setSelectedPDF] = useState<PDFFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<ImagePreview | null>(null);
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);


  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!patientInfo.name.trim()) {
      newErrors.name = 'Patient name is required';
    }

    if (!patientInfo.age || parseInt(patientInfo.age) <= 0) {
      newErrors.age = 'Please enter a valid age';
    }

    if (selectedFiles.length === 0) {
      newErrors.files = 'At least one medical image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateFileType = (file: File): boolean => {
    return ALLOWED_FILE_TYPES.includes(file.type);
  };

  const validateFileSize = (file: File): boolean => {
    return file.size <= MAX_FILE_SIZE;
  };

  const validatePDFFile = (file: File): boolean => {
    if (file.type !== ALLOWED_PDF_TYPE) {
      setRejectedFiles(prev => [...prev, `${file.name} (Invalid file type - only PDF allowed)`]);
      return false;
    }
    if (file.size > MAX_PDF_SIZE) {
      setRejectedFiles(prev => [...prev, `${file.name} (Exceeds 10MB size limit)`]);
      return false;
    }
    return true;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPatientInfo(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    
    fileArray.forEach(file => {
      if (!validateFileType(file)) {
        invalidFiles.push(`${file.name} (Invalid file type - only JPG and PNG allowed)`);
      } else if (!validateFileSize(file)) {
        invalidFiles.push(`${file.name} (Exceeds 1MB size limit)`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      setRejectedFiles(invalidFiles);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          setImagePreviews(prev => [...prev, {
            url: reader.result as string,
            file,
            name: file.name
          }]);
        };
        reader.readAsDataURL(file);
      });
    }

    if (errors.files) {
      setErrors(prev => ({ ...prev, files: undefined }));
    }
  };

  const handlePDFUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (validatePDFFile(file)) {
      setSelectedPDF({
        file,
        name: file.name,
        size: formatFileSize(file.size)
      });
      if (errors.medicalRecords) {
        setErrors(prev => ({ ...prev, medicalRecords: undefined }));
      }
    }
  };

  const removeImage = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const removePDF = () => {
    setSelectedPDF(null);
  };

  const handleImageClick = (preview: ImagePreview) => {
    setSelectedImage(preview);
    setIsModalOpen(true);
  };

  const clearRejectedFiles = () => {
    setRejectedFiles([]);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      // Convert images to base64
      const imagePromises = selectedFiles.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(reader.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });
  
      const base64Images = await Promise.all(imagePromises);
  
      // Prepare the request body
      const requestBody = {
        name: patientInfo.name,
        age: patientInfo.age,
        symptoms: patientInfo.symptoms,
        medicalHistory: patientInfo.medicalHistory,
        currentMedications: patientInfo.currentMedications,
        images: base64Images
      };
  
      // Send to your API
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
  
      if (!response.ok) {
        throw new Error('Failed to save analysis');
      }
  
      const data: ApiResponse = await response.json();
  
      // Handle successful analysis
      if (data.results) {
        setAnalysisResults(data.results);
      }
  
      // Call success callback if provided
      onSuccess?.();
  
    } catch (error) {
      console.error('Submission error:', error);
      // TODO: Add error handling UI
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to submit analysis. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rejected Files Alert */}
      {rejectedFiles.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            The following files were not uploaded:
            <ul className="mt-2 list-disc list-inside">
              {rejectedFiles.map((fileName, index) => (
                <li key={index}>{fileName}</li>
              ))}
            </ul>
            <Button
              variant="outline"
              size="sm"
              onClick={clearRejectedFiles}
              className="mt-2"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}
  
      {/* Submit Error Alert */}
      {errors.submit && (
        <Alert variant="destructive">
          <AlertDescription>
            {errors.submit}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setErrors(prev => ({ ...prev, submit: undefined }))}
              className="mt-2"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}
  
      {/* Patient Information Card */}
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
              <label className="block text-sm font-medium mb-1">
                Patient Name <span className="text-red-500">*</span>
              </label>
              <Input
                name="name"
                value={patientInfo.name}
                onChange={handleInputChange}
                className={`w-full ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Enter patient name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Age <span className="text-red-500">*</span>
              </label>
              <Input
                name="age"
                type="number"
                value={patientInfo.age}
                onChange={handleInputChange}
                className={`w-full ${errors.age ? 'border-red-500' : ''}`}
                placeholder="Enter age"
                min="1"
              />
              {errors.age && (
                <p className="mt-1 text-sm text-red-500">{errors.age}</p>
              )}
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
        </CardContent>
      </Card>
  
      {/* Medical Records Card */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Medical Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`bg-background-100 border border-background-200 rounded-lg p-4`}>
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-primary-500" />
              <label className="text-sm font-medium text-primary-900 cursor-pointer">
                Upload Medical Records (PDF only, max 10MB)
                <input
                  type="file"
                  onChange={handlePDFUpload}
                  className="hidden"
                  accept="application/pdf"
                />
              </label>
            </div>
  
            {selectedPDF && (
              <div className="mt-4 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">{selectedPDF.name}</p>
                    <p className="text-xs text-gray-500">{selectedPDF.size}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removePDF}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
  
      {/* Medical Images Card */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Medical Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`bg-background-100 border ${errors.files ? 'border-red-500' : 'border-background-200'} rounded-lg p-4`}>
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-primary-500" />
              <label className="text-sm font-medium text-primary-900 cursor-pointer">
                Upload Medical Images (JPG/PNG only) <span className="text-red-500">*</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/jpeg,image/png"
                />
              </label>
              {selectedFiles.length > 0 && (
                <span className="text-sm text-primary-600">
                  {selectedFiles.length} file(s) selected
                </span>
              )}
            </div>
            {errors.files && (
              <p className="mt-2 text-sm text-red-500">{errors.files}</p>
            )}
          </div>
  
          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group bg-white">
                  <div 
                    className="relative cursor-pointer overflow-hidden rounded-lg h-32"
                    onClick={() => handleImageClick(preview)}
                  >
                    <img
                      src={preview.url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-contain bg-white rounded-lg transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-transparent group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                      <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
  
      {/* Analysis Results Card */}
      {analysisResults && analysisResults.length > 0 && (
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {analysisResults.map((result, index) => (
                <div key={index} className="relative">
                  {result.visualization_path && (
                    <div className="relative cursor-pointer overflow-hidden rounded-lg h-32">
                      <img
                        src={`http://localhost:8000${result.visualization_path}`}
                        alt={`Analysis Result ${index + 1}`}
                        className="w-full h-full object-contain bg-white rounded-lg"
                        onClick={() => handleImageClick({
                          url: `http://localhost:8000${result.visualization_path!}`,
                          file: selectedFiles[index],
                          name: result.filename
                        })}
                      />
                    </div>
                  )}
                  {result.annotations.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      Found {result.annotations.length} annotations
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
  
      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary-500 hover:bg-primary-600 text-white px-6"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Clock className="animate-spin h-4 w-4" />
              Processing...
            </div>
          ) : (
            'Save Analysis'
          )}
        </Button>
      </div>
  
      {/* Image Preview Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl w-full p-0">
          {selectedImage && (
            <div className="relative">
              <img
                src={selectedImage.url}
                alt={selectedImage.name || "Preview"}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <div className="absolute top-2 right-2">
                <Button
                  variant="destructive"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setIsModalOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {selectedImage.name && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                  {selectedImage.name}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default NewAnalysis;
