import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Maximize2, X, Calendar, User, FileText, Pill } from 'lucide-react';
import { FrontendAnalysis as Analysis } from '@/lib/db/types';

interface AnalysisDetailProps {
  analysis: Analysis;
  onDelete: () => void;
}

const AnalysisDetail: React.FC<AnalysisDetailProps> = ({ analysis }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!analysis) {
    return <div>Analysis not found</div>;
  }

  const getImageSrc = (base64Data: string) => {
    // If it's already a data URI, return directly
    if (base64Data.startsWith('data:')) {
      return base64Data;
    }
    
    // Determine MIME type from Base64 content
    if (base64Data.startsWith('iVBORw')) { // PNG signature
      return `data:image/png;base64,${base64Data}`;
    }
    if (base64Data.startsWith('/9j/') || base64Data.startsWith('FFD8')) { // JPEG signatures
      return `data:image/jpeg;base64,${base64Data}`;
    }
    if (base64Data.includes('svg')) { // SVG content (caution: might not be reliable)
      return `data:image/svg+xml;base64,${base64Data}`;
    }
  
    // Default to JPEG if unknown
    return `data:image/jpeg;base64,${base64Data}`;
  };

  const handleImageClick = (imageData: string) => {
    setSelectedImage(getImageSrc(imageData));
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg text-primary-900">{analysis.patientName}</h3>
              <div className="mt-2 flex items-center gap-2 text-primary-600">
                <Calendar className="w-4 h-4" />
                <span>{new Date(analysis.date).toLocaleDateString()}</span>
              </div>
              <div className="mt-2">
                <span className="text-sm text-primary-600">Age: </span>
                <span className="font-medium">{analysis.age}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Current Symptoms
                </h4>
                <p className="mt-1 text-primary-600">{analysis.symptoms || 'None recorded'}</p>
              </div>
              
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Medical History
                </h4>
                <p className="mt-1 text-primary-600">{analysis.medicalHistory || 'None recorded'}</p>
              </div>
              
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <Pill className="w-4 h-4" />
                  Current Medications
                </h4>
                <p className="mt-1 text-primary-600">{analysis.currentMedications || 'None recorded'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {analysis.images && analysis.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Medical Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {analysis.images.map((imageData, index) => (
                <div 
                  key={index}
                  className="relative group cursor-pointer"
                  onClick={() => handleImageClick(imageData)}
                >
                   <div className="aspect-square rounded-lg overflow-hidden bg-white">
                    <img
                      src={getImageSrc(imageData)}
                      alt={`Medical image ${index + 1}`}
                      className="w-full h-full object-contain transition-transform duration-200"
                    />
                   </div>
                   <div className="absolute inset-0 group-hover:bg-black/20 transition-opacity flex items-center justify-center">
                     <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                 </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl w-full p-0">
          {selectedImage && (
            <div className="relative">
              <img
                src={selectedImage}
                alt="Medical image"
                className="w-full h-auto max-h-[80vh] object-contain bg-white"
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnalysisDetail;