import React, { useState, useEffect } from "react";
import { AlertSettings } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings as SettingsIcon, 
  Save, 
  AlertTriangle, 
  Users,
  Phone,
  Mail,
  Plus,
  Trash2
} from "lucide-react";

const locations = [
  { value: "main_entrance", label: "Main Entrance" },
  { value: "food_court", label: "Food Court" },
  { value: "exhibition_hall", label: "Exhibition Hall" },
  { value: "parking_area", label: "Parking Area" },
  { value: "emergency_exit", label: "Emergency Exit" }
];

export default function Settings() {
  const [settings, setSettings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await AlertSettings.list();
      
      // Ensure all locations have settings
      const completeSettings = locations.map(location => {
        const existing = data.find(s => s.location === location.value);
        return existing || {
          location: location.value,
          max_capacity: 100,
          warning_threshold: 0.8,
          critical_threshold: 0.9,
          alert_email: "",
          emergency_contacts: [
            { name: "Security Team", phone: "+1-555-0911", role: "Security" },
            { name: "Facility Manager", phone: "+1-555-0912", role: "Management" }
          ]
        };
      });
      
      setSettings(completeSettings);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (location, field, value) => {
    setSettings(prev => prev.map(setting => 
      setting.location === location 
        ? { ...setting, [field]: value }
        : setting
    ));
  };

  const updateEmergencyContact = (location, contactIndex, field, value) => {
    setSettings(prev => prev.map(setting => 
      setting.location === location 
        ? {
            ...setting,
            emergency_contacts: setting.emergency_contacts.map((contact, index) =>
              index === contactIndex ? { ...contact, [field]: value } : contact
            )
          }
        : setting
    ));
  };

  const addEmergencyContact = (location) => {
    setSettings(prev => prev.map(setting => 
      setting.location === location 
        ? {
            ...setting,
            emergency_contacts: [
              ...(setting.emergency_contacts || []),
              { name: "", phone: "", role: "" }
            ]
          }
        : setting
    ));
  };

  const removeEmergencyContact = (location, contactIndex) => {
    setSettings(prev => prev.map(setting => 
      setting.location === location 
        ? {
            ...setting,
            emergency_contacts: setting.emergency_contacts.filter((_, index) => index !== contactIndex)
          }
        : setting
    ));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Delete existing settings and recreate
      const existingSettings = await AlertSettings.list();
      for (const existing of existingSettings) {
        await AlertSettings.delete(existing.id);
      }

      // Create new settings
      for (const setting of settings) {
        await AlertSettings.create(setting);
      }

      setMessage("Settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(`Error saving settings: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Loading Settings...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent mb-2">
            Alert Settings
          </h1>
          <p className="text-slate-600">Configure overcrowding thresholds and emergency contacts for each location</p>
        </div>

        {message && (
          <Alert className={`mb-6 ${message.includes('Error') ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className={message.includes('Error') ? 'text-red-800' : 'text-green-800'}>
              {message}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {settings.map((setting) => {
            const location = locations.find(l => l.value === setting.location);
            return (
              <Card key={setting.location} className="bg-white/80 backdrop-blur-sm border-slate-200/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5 text-blue-600" />
                    {location?.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Capacity Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`capacity-${setting.location}`}>Maximum Capacity</Label>
                      <div className="relative">
                        <Users className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <Input
                          id={`capacity-${setting.location}`}
                          type="number"
                          value={setting.max_capacity}
                          onChange={(e) => updateSetting(setting.location, 'max_capacity', parseInt(e.target.value))}
                          className="pl-10"
                          placeholder="100"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`warning-${setting.location}`}>Warning Threshold (%)</Label>
                      <Input
                        id={`warning-${setting.location}`}
                        type="number"
                        min="0"
                        max="100"
                        value={Math.round(setting.warning_threshold * 100)}
                        onChange={(e) => updateSetting(setting.location, 'warning_threshold', parseInt(e.target.value) / 100)}
                        placeholder="80"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`critical-${setting.location}`}>Critical Threshold (%)</Label>
                      <Input
                        id={`critical-${setting.location}`}
                        type="number"
                        min="0"
                        max="100"
                        value={Math.round(setting.critical_threshold * 100)}
                        onChange={(e) => updateSetting(setting.location, 'critical_threshold', parseInt(e.target.value) / 100)}
                        placeholder="90"
                      />
                    </div>
                  </div>

                  {/* Alert Email */}
                  <div className="space-y-2">
                    <Label htmlFor={`email-${setting.location}`}>Alert Email</Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <Input
                        id={`email-${setting.location}`}
                        type="email"
                        value={setting.alert_email}
                        onChange={(e) => updateSetting(setting.location, 'alert_email', e.target.value)}
                        className="pl-10"
                        placeholder="admin@facility.com"
                      />
                    </div>
                  </div>

                  {/* Emergency Contacts */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Emergency Contacts</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addEmergencyContact(setting.location)}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Contact
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {(setting.emergency_contacts || []).map((contact, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border border-slate-200 rounded-lg bg-slate-50">
                          <Input
                            placeholder="Contact Name"
                            value={contact.name}
                            onChange={(e) => updateEmergencyContact(setting.location, index, 'name', e.target.value)}
                          />
                          <div className="relative">
                            <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <Input
                              placeholder="Phone Number"
                              value={contact.phone}
                              onChange={(e) => updateEmergencyContact(setting.location, index, 'phone', e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          <Input
                            placeholder="Role/Department"
                            value={contact.role}
                            onChange={(e) => updateEmergencyContact(setting.location, index, 'role', e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeEmergencyContact(setting.location, index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Capacity Preview */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Threshold Preview</h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div>• Warning Alert: {Math.round(setting.max_capacity * setting.warning_threshold)} people ({Math.round(setting.warning_threshold * 100)}%)</div>
                      <div>• Critical Alert: {Math.round(setting.max_capacity * setting.critical_threshold)} people ({Math.round(setting.critical_threshold * 100)}%)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={saveSettings}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save All Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}