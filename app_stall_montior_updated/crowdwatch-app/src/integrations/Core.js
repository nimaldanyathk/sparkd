export const UploadFile = async ({ file }) => ({
  file_url: URL.createObjectURL(file)
});

export const InvokeLLM = async ({ prompt, file_urls, response_json_schema }) => ({
  people_count: Math.floor(Math.random() * 50) + 10,
  confidence_score: 0.8 + Math.random() * 0.2,
  analysis_notes: "Mock analysis result"
});

export const SendEmail = async ({ to, subject, body }) => {
  console.log('Mock email sent:', { to, subject, body });
  return true;
};