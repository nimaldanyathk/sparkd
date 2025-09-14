import React, { useState, useRef } from "react";
import { CrowdReading, AlertSettings } from "../entities/all";
import { UploadFile, InvokeLLM, SendEmail } from "../integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";
import { 
  Upload as UploadIcon, 
  Camera, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState("main_entrance");
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const locations = [
    { value: "main_entrance", label: "Main Entrance" },
    { value: "food_court", label: "Food Court" },
    { value: "exhibition_hall", label: "Exhibition Hall" },
    { value: "parking_area", label: "Parking Area" },
    { value: "emergency_exit", label: "Emergency Exit" }
  ];

  const handleFileSelect = (file) => {
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setSelectedFile(file);
      setError(null);
      setResults(null);
    } else {
      setError("Please select an image file (PNG, JPG, JPEG) or PDF");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const processImage = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Upload file
      const { file_url } = await UploadFile({ file: selectedFile });
      
      // Analyze image with AI
      const analysisResult = await InvokeLLM({
        prompt: `Analyze this image and count the number of people visible. Look carefully for all people, including those partially visible or in the background. Also assess the confidence level of your count. Return your analysis in the specified JSON format.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            people_count: {
              type: "number",
              description: "Total number of people detected in the image"
            },
            confidence_score: {
              type: "number",
              minimum: 0,
              maximum: 1,
              description: "Confidence level in the detection (0-1)"
            },
            analysis_notes: {
              type: "string", 
              description: "Brief notes about what was observed"
            },
            environmental_conditions: {
              type: "object",
              properties: {
                lighting: { type: "string" },
                crowd_density: { type: "string" }
              }
            }
          },
          required: ["people_count", "confidence_score"]
        }
      });

      // Generate mock environmental data
      const temperature = Math.round(20 + Math.random() * 15);
      const humidity = Math.round(40 + Math.random() * 40);

      // Save to database
      const crowdReading = await CrowdReading.create({
        people_count: analysisResult.people_count,
        confidence_score: analysisResult.confidence_score,
        image_url: file_url,
        location: selectedLocation,
        temperature: temperature,
        humidity: humidity,
        device_id: "ESP32-CAM-MANUAL"
      });

      // Check for alerts
      const settings = await AlertSettings.list();
      const locationSetting = settings.find(s => s.location === selectedLocation);
      
      let alertTriggered = false;
      if (locationSetting) {
        const criticalThreshold = locationSetting.max_capacity * locationSetting.critical_threshold;
        const warningThreshold = locationSetting.max_capacity * locationSetting.warning_threshold;
        
        if (analysisResult.people_count >= criticalThreshold) {
          alertTriggered = true;
          await CrowdReading.update(crowdReading.id, { alert_triggered: true });
          
          // Send alert email
          if (locationSetting.alert_email) {
            await SendEmail({
              to: locationSetting.alert_email,
              subject: `🚨 Critical Overcrowding Alert - ${locations.find(l => l.value === selectedLocation)?.label}`,
              body: `CRITICAL ALERT: ${analysisResult.people_count} people detected at ${locations.find(l => l.value === selectedLocation)?.label}. This exceeds the critical threshold of ${Math.round(criticalThreshold)} people. Immediate action required.`
            });
          }
        }
      }

      setResults({
        ...analysisResult,
        temperature,
        humidity,
        alertTriggered,
        file_url
      });

    } catch (error) {
      setError(`Processing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent mb-2">
            Process Image
          </h1>
          <p className="text-slate-600">Analyze crowd density using AI-powered people detection</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                Image Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Location Selection */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.value} value={location.value}>
                        {location.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                  dragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-slate-400" />
                  </div>
                  
                  {selectedFile ? (
                    <div>
                      <p className="font-medium text-slate-900">{selectedFile.name}</p>
                      <p className="text-sm text-slate-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-slate-900">Drop image here or click to browse</p>
                      <p className="text-sm text-slate-500">Supports PNG, JPG, JPEG, PDF</p>
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <UploadIcon className="w-4 h-4" />
                    Choose File
                  </Button>
                </div>
              </div>

              {/* Process Button */}
              <Button
                onClick={processImage}
                disabled={!selectedFile || isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Image...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    Analyze Crowd Density
                  </>
                )}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Analysis Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Alert Banner */}
                    {results.alertTriggered && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          Critical overcrowding detected! Alert sent to administrators.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* People Count */}
                    <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                      <div className="text-4xl font-bold text-slate-900 mb-2">
                        {results.people_count}
                      </div>
                      <p className="text-slate-600">People Detected</p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-slate-500">
                          {Math.round(results.confidence_score * 100)}% confidence
                        </span>
                      </div>
                    </div>

                    {/* Environmental Data */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="text-2xl font-bold text-orange-800">{results.temperature}°C</div>
                        <p className="text-sm text-orange-600">Temperature</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-2xl font-bold text-blue-800">{results.humidity}%</div>
                        <p className="text-sm text-blue-600">Humidity</p>
                      </div>
                    </div>

                    {/* Analysis Notes */}
                    {results.analysis_notes && (
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="font-medium text-slate-900 mb-2">Analysis Notes</h4>
                        <p className="text-sm text-slate-600">{results.analysis_notes}</p>
                      </div>
                    )}

                    {/* Original Image */}
                    <div className="space-y-2">
                      <Label>Processed Image</Label>
                      <img
                        src={results.file_url}
                        alt="Analyzed crowd image"
                        className="w-full h-48 object-cover rounded-lg border border-slate-200"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}