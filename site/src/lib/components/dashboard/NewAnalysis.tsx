import { useState, ChangeEvent, FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Upload, Clock, User, X, Maximize2 } from 'lucide-react';
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
  [key: string]: string | undefined;
}

interface ImagePreview {
  url: string;
  file: File;
  name: string;
}

const MAX_FILE_SIZE = 1024 * 1024; // 1MB in bytes

const NewAnalysis = () => {
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: '',
    age: '',
    symptoms: '',
    medicalHistory: '',
    currentMedications: '',
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<ImagePreview | null>(null);
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);

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

  const validateFileSize = (file: File): boolean => {
    return file.size <= MAX_FILE_SIZE;
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
      if (validateFileSize(file)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
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

  const removeImage = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
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
      const base64Images = await Promise.all(
        selectedFiles.map(file => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64String = reader.result as string;
              const base64 = base64String.split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );
  
      const requestBody = {
        ...patientInfo,
        images: base64Images
      };
  
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Analysis saved successfully:', data);
      
    } catch (error) {
      console.error('Error saving analysis:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {rejectedFiles.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            The following files exceed the 1MB size limit and were not uploaded:
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

          <div className="mt-4">
            <div className={`bg-background-100 border ${errors.files ? 'border-red-500' : 'border-background-200'} rounded-lg p-4`}>
              <div className="flex items-center gap-3">
                <Upload className="h-5 w-5 text-primary-500" />
                <label className="text-sm font-medium text-primary-900 cursor-pointer">
                  Upload Medical Images <span className="text-red-500">*</span>
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