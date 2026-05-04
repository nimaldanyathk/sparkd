import emailjs from '@emailjs/browser';

export const UploadFile = async ({ file }) => ({
  file_url: URL.createObjectURL(file)
});

export const InvokeLLM = async ({ prompt, file_urls, response_json_schema }) => ({
  people_count: Math.floor(Math.random() * 50) + 10,
  confidence_score: 0.8 + Math.random() * 0.2,
  analysis_notes: "Mock analysis result"
});

export const SendEmail = async ({ to, subject, body }) => {
  // REPLACE THESE WITH YOUR ACTUAL EMAILJS KEYS
  const SERVICE_ID = 'YOUR_SERVICE_ID';
  const TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
  const PUBLIC_KEY = 'YOUR_PUBLIC_KEY';

  try {
    const templateParams = {
      to_email: to,
      subject: subject,
      message: body,
    };

    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log('EmailJS Success:', response.status, response.text);
    return true;
  } catch (error) {
    console.error('EmailJS Failed:', error);
    // Determine if it failed due to placeholders
    if (error.text && error.text.includes("The user_id parameter is required")) {
      console.warn("Please set your EmailJS Public Key in src/integrations/Core.js");
    }
    return false;
  }
};